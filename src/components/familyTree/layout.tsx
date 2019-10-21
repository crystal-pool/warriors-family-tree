import List from "linked-list";
import wu from "wu";
import { buildUnorderedIdPair, parseUnorderedIdPair } from "../../utility/general";
import { ListItem } from "../../utility/linkedList";
import { IFamilyTreeData } from "./FamilyTree";
import { Polynomial, Contraint, buildJSLPModel } from "../../utility/lpsolverUtility";
import * as Solver from "javascript-lp-solver";

export interface ILayoutNode {
    id: string;
    row: number;
    column: number;
    offsetX: number;
}

export interface ICoupleLayoutConnection {
    // Upper row node
    id1: string;
    // Lower row node
    id2: string;
    // Upper row slot
    slot1: number;
    childrenSlot?: number;
    childrenId?: string[];
}

export interface ISingleParentLayoutConnection {
    id1: string;
    childrenSlot?: number;
    childrenId?: string[];
}

export type ILayoutConnection = ICoupleLayoutConnection | ISingleParentLayoutConnection;

export interface IFamilyTreeLayoutInfo {
    rows: ILayoutNode[][];
    rowSlotCount: number[];
    mateConnections: ILayoutConnection[];
    rootNodeCount: number;
    rawWidth: number;
    minNodeSpacingX: number;
    nodeFromId(id: string): ILayoutNode | undefined;
    children: Iterable<[string, string | undefined, Iterable<string>]>;
}

export function layoutFamilyTree(props: Readonly<IFamilyTreeData>): IFamilyTreeLayoutInfo | null {
    const matesLookup = new Map<string, Set<string>>();
    const childrenLookup = new Map<string, Set<string>>();
    const knownNodes = new Set<string>();
    for (const [id1, id2] of wu.chain(props.mates,
        wu.filter(t => !!t[1], props.children).map(t => [t[0], t[1]!]))
    ) {
        if (id1 === id2) throw new Error(`Detected self-mating: ${id1}.`);
        let siblings1 = matesLookup.get(id1) || matesLookup.set(id1, new Set()).get(id1)!;
        let siblings2 = matesLookup.get(id2) || matesLookup.set(id2, new Set()).get(id2)!;
        siblings1.add(id2);
        siblings2.add(id1);
        knownNodes.add(id1).add(id2);
    }
    for (const [id1, id2, id3] of props.children) {
        const key = buildUnorderedIdPair(id1, id2);
        let children = childrenLookup.get(key) || childrenLookup.set(key, new Set()).get(key)!;
        children.add(id3);
        knownNodes.add(id1).add(id3);
        if (id2) knownNodes.add(id2);
    }
    if (knownNodes.size === 0) return null;
    const rawRows = arrangeRows(knownNodes, matesLookup, childrenLookup);
    for (let i = 0; i < rawRows.length; i++) {
        rawRows[i] = arrangeRow(rawRows[i], rawRows[i - 1], matesLookup, childrenLookup);
    }
    // Layout nodes.
    const offsetXLookup = layoutRow(rawRows, matesLookup, childrenLookup);
    const rows = rawRows.map((nodes, row) => nodes.map((id, column): ILayoutNode => ({ id, row, column, offsetX: offsetXLookup[id] })));
    const layoutNodes = new Map<string, ILayoutNode>();
    rows.forEach(nodes => nodes.forEach(n => layoutNodes.set(n.id, n)));

    let nodeSpacing = 1;
    // Layout connections.
    const occupiedSlotsMap = new Map<string, boolean[]>();
    function findVacantSlot(ids: Iterable<string>, occupySlot: boolean): number {
        // WuIterator does not support iterations more than once.
        if (occupySlot && !Array.isArray(ids)) ids = Array.from(ids);
        const slots = wu(ids).map(id => occupiedSlotsMap.get(id)).filter(s => !!s).toArray() as boolean[][];
        const vacant = wu.count(1).find(i => slots.every(s => !s[i]))!;
        occupySlot && wu(ids).forEach(id => declareSlotOccupied(id, vacant));
        return vacant;
    }
    function declareSlotOccupied(id: string, slotIndex: number): void {
        const slots = occupiedSlotsMap.get(id) || occupiedSlotsMap.set(id, []).get(id)!;
        console.assert(!slots[slotIndex]);
        slots[slotIndex] = true;
    }
    const connections: ILayoutConnection[] = [];
    const visitedNodes = new Set<string>();
    for (const row of rows) {
        // internal representation: slot index increases as slot goes above.
        // Bottom-most has the smallest index (1).
        // 0 means the connection can be drawn directly from sibling node to sibling node.
        for (let i = 0; i < row.length; i++) {
            const node = row[i];
            const mates = matesLookup.get(node.id);
            if (!mates) continue;
            const next = i < row.length - 1 ? row[i + 1] : undefined;
            visitedNodes.add(node.id);
            // Mates
            for (const mate of mates) {
                if (visitedNodes.has(mate)) continue;
                const occupiedSlots = occupiedSlotsMap.get(node.id) || occupiedSlotsMap.set(node.id, []).get(node.id)!;
                if (!occupiedSlots[0]) {
                    if (next && next.id === mate) {
                        connections.push({ id1: node.id, id2: mate, slot1: 0 });
                        occupiedSlots[0] = true;
                        continue;
                    }
                }
                const mateNode = layoutNodes.get(mate);
                console.assert(mateNode);
                if (!mateNode) continue;
                const lNode = node.offsetX <= mateNode.offsetX ? node : mateNode;
                const rNode = node.offsetX <= mateNode.offsetX ? mateNode : node;
                if (node.row === mateNode.row) {
                    console.assert(lNode.column <= rNode.column);
                    // Same row.
                    const slot = findVacantSlot(wu(row).slice(lNode.column, rNode.column + 1).map(r => r.id), true);
                    connections.push({ id1: node.id, id2: mate, slot1: slot });
                } else {
                    // Different row. Prefer to use slot of the upper node.
                    const uNode = node.row < mateNode.row ? node : mateNode;
                    const dNode = node.row < mateNode.row ? mateNode : node;
                    const uRow = rows[uNode.row];
                    const slot1 = findVacantSlot(wu(uRow)
                        .filter(n => n.offsetX >= lNode.offsetX - nodeSpacing && n.offsetX <= rNode.offsetX + nodeSpacing)
                        .map(r => r.id), true);
                    connections.push({ id1: uNode.id, id2: dNode.id, slot1 });
                }
            }
        }
    }
    // Children
    for (const connection of connections) {
        if (!("id2" in connection)) {
            console.assert("id2" in connection);
            continue;
        }
        // TODO children with single parent
        const node1 = layoutNodes.get(connection.id1)!;
        const node2 = layoutNodes.get(connection.id2)!;
        const children = childrenLookup.get(buildUnorderedIdPair(connection.id1, connection.id2));
        if (!children) continue;
        const minOffsetX = Math.min(node1.offsetX, node2.offsetX, ...wu(children).map(id => layoutNodes.get(id)!.offsetX));
        const maxOffsetX = Math.max(node1.offsetX, node2.offsetX, ...wu(children).map(id => layoutNodes.get(id)!.offsetX));
        const slot = findVacantSlot(wu(rows[node2.row])
            .filter(n => n.offsetX >= minOffsetX - nodeSpacing && n.offsetX <= maxOffsetX + nodeSpacing)
            .map(n => n.id), true);
        connection.childrenSlot = slot;
        connection.childrenId = Array.from(children);
    }
    for (const [id, node] of layoutNodes) {
        const children = childrenLookup.get(buildUnorderedIdPair(id));
        if (!children) continue;
        const minOffsetX = Math.min(node.offsetX, ...wu(children).map(id => layoutNodes.get(id)!.offsetX));
        const maxOffsetX = Math.max(node.offsetX, ...wu(children).map(id => layoutNodes.get(id)!.offsetX));
        const slot = findVacantSlot(wu(rows[node.row])
            .filter(n => n.offsetX >= minOffsetX - nodeSpacing && n.offsetX <= maxOffsetX + nodeSpacing)
            .map(n => n.id), true);
        connections.push({ id1: id, childrenSlot: slot, childrenId: Array.from(children) });
    }
    const rawWidth = rows.reduce((p, row) => row.reduce((p, node) => Math.max(p, node.offsetX), 0), 0) + 2;
    return {
        rows: rows,
        rootNodeCount: rows[0].length,
        rowSlotCount: rows.map(row => row.reduce((p, n) => Math.max(p, (occupiedSlotsMap.get(n.id) || []).length - 1), 0)),
        rawWidth, minNodeSpacingX: nodeSpacing,
        mateConnections: connections,
        nodeFromId: id => layoutNodes.get(id),
        children: wu(childrenLookup).map(([p, c]) => {
            const [p1, p2] = parseUnorderedIdPair(p);
            return [p1, p2, c];
        })
    };
}

function arrangeRows(knownNodes: Iterable<string>, matesLookup: Map<string, Set<string>>, childrenLookup: Map<string, Set<string>>): string[][] {
    const orderedNodes = Array.from(knownNodes);
    const nodeIndexLookup = new Map(orderedNodes.map((v, i) => [v, i]));
    const objective: Polynomial = {};
    const constraints: Contraint[] = [];
    const ints: string[] = [];
    const yMax = orderedNodes.length;
    function addObjective(name: string, addition: number): void {
        const existingCoeff = objective[name];
        objective[name] = existingCoeff != null ? (existingCoeff + addition) : addition;
    }
    function buildUnorderedIndexPair(nodeId1: string, nodeId2: string): string {
        const index1 = nodeIndexLookup.get(nodeId1)!;
        const index2 = nodeIndexLookup.get(nodeId2)!;
        console.assert(index1 != null);
        console.assert(index2 != null);
        return index1 <= index2 ? (index1 + "_" + index2) : (index2 + "_" + index1);
    }
    function varNameY(nodeId: string): string {
        const index = nodeIndexLookup.get(nodeId);
        console.assert(index != null);
        return "ny_" + index;
    }
    function varNameDYP(nodeId1: string, nodeId2: string): string {
        return "dyp_" + buildUnorderedIndexPair(nodeId1, nodeId2);
    }
    function varNameDYN(nodeId1: string, nodeId2: string): string {
        return "dyn_" + buildUnorderedIndexPair(nodeId1, nodeId2);
    }
    for (const n1 of orderedNodes) {
        constraints.push([{ [varNameY(n1)]: 1 }, ">=", 0]);
        constraints.push([{ [varNameY(n1)]: 1 }, "<=", yMax]);
        ints.push(varNameY(n1));
        // Make coordinates as small as possible.
        addObjective(varNameY(n1), 1);
    }
    for (const [n1, mates] of matesLookup) {
        for (const n2 of mates) {
            if (n1 >= n2) continue;
            constraints.push([{ [varNameDYP(n1, n2)]: 1, [varNameDYN(n1, n2)]: -1, [varNameY(n1)]: -1, [varNameY(n2)]: 1 }, "=", 0]);
            addObjective(varNameDYP(n1, n2), 10);
            addObjective(varNameDYN(n1, n2), 10);
        }
    }
    for (const [p, children] of childrenLookup) {
        const [p1, p2] = parseUnorderedIdPair(p);
        for (const c of children) {
            constraints.push([{ [varNameY(c)]: 1, [varNameY(p1)]: -1 }, ">=", 1]);
            addObjective(varNameY(c), 5);
            addObjective(varNameY(p1), -5);
            if (p2) {
                constraints.push([{ [varNameY(c)]: 1, [varNameY(p2)]: -1 }, ">=", 1]);
                addObjective(varNameY(c), 5);
                addObjective(varNameY(p2), -5);
            }
        }
    }
    const model = buildJSLPModel({ opType: "min", objective, constraints, intVariables: ints });
    model.options = { timeout: 30000 };
    const solution = Solver.Solve(model);
    if (!solution.feasible) {
        throw new Error("Infeasible model: arrangeRows.");
    }
    const rows: string[][] = [];
    for (const node of orderedNodes) {
        const rowIndex = solution[varNameY(node)] || 0;
        let row = rows[rowIndex];
        if (row == null) row = rows[rowIndex] = [];
        row.push(node);
    }
    console.log(rows);
    return rows;
}

function arrangeRow(nodes: string[], prevRow: string[] | undefined, matesLookup: Map<string, Set<string>>, childrenLookup: Map<string, Set<string>>): string[] {
    const arrangedRow: string[] = [];
    const incomingNodes = new Set(nodes);
    function pushChildren(children: Iterable<string>): void {
        const groupStart = arrangedRow.length;
        const delayedNodes: string[] = [];
        for (const c of children) {
            if (!incomingNodes.has(c)) continue;
            incomingNodes.delete(c);
            const mates = matesLookup.get(c);
            let inserted = false;
            if (mates) {
                // Put mates nearer to each other.
                if (arrangedRow.some(n => mates.has(n))) {
                    arrangedRow.splice(groupStart, 0, c)
                    inserted = true;
                } else if (wu(incomingNodes).some(n => mates.has(n))) {
                    delayedNodes.push(c);
                    inserted = true;
                }
            }
            if (!inserted) arrangedRow.push(c);
        }
        arrangedRow.push(...delayedNodes);
    }
    if (prevRow) {
        // Arrange children first.
        for (const prevNode of prevRow) {
            const singleChildren = childrenLookup.get(buildUnorderedIdPair(prevNode));
            if (singleChildren) pushChildren(singleChildren);
            const mates = matesLookup.get(prevNode);
            if (mates) {
                for (const mate of mates) {
                    const children = childrenLookup.get(buildUnorderedIdPair(prevNode, mate));
                    if (children) pushChildren(children);
                }
            }
        }
    }
    // Then insert the mates.
    for (const node of incomingNodes) {
        const mates = matesLookup.get(node);
        let inserted = false;
        if (mates) {
            for (const mate of mates) {
                if (!incomingNodes.has(mate)) {
                    const mateIndex = arrangedRow.indexOf(mate);
                    if (mateIndex >= 0) {
                        arrangedRow.splice(mateIndex + 1, 0, node);
                        inserted = true;
                        break;
                        // TODO when insert twice or more?
                    }
                }
            }
        }
        if (!inserted) {
            arrangedRow.push(node);
        }
        incomingNodes.delete(node);
    }
    return arrangedRow;
}

function layoutRow(rows: string[][], matesLookup: Map<string, Set<string>>, childrenLookup: Map<string, Set<string>>): Record<string, number> {
    const orderedNodes: string[] = Array.from(wu(rows).flatten());
    const nodeIndexLookup = new Map(orderedNodes.map((v, i) => [v, i]));
    const objective: Polynomial = {};
    const constraints: Contraint[] = [];
    const ints: string[] = [];
    const nodeWidth = 1;
    const xMax = rows.reduce((p, r) => Math.max(p, r.length), 0) * nodeWidth * 2;
    const dxNodes = new Set<string>();
    function addObjective(name: string, addition: number): void {
        const existingCoeff = objective[name];
        objective[name] = existingCoeff != null ? (existingCoeff + addition) : addition;
    }
    function buildUnorderedIndexPair(nodeId1: string, nodeId2: string): string {
        const index1 = nodeIndexLookup.get(nodeId1)!;
        const index2 = nodeIndexLookup.get(nodeId2)!;
        console.assert(index1 != null);
        console.assert(index2 != null);
        return index1 <= index2 ? (index1 + "_" + index2) : (index2 + "_" + index1);
    }
    function varNameX(nodeId: string): string {
        return "nx_" + nodeIndexLookup.get(nodeId);
    }
    function varNameDXP(nodeId1: string, nodeId2: string): string {
        return "dxp_" + buildUnorderedIndexPair(nodeId1, nodeId2);
    }
    function varNameDXN(nodeId1: string, nodeId2: string): string {
        return "dxn_" + buildUnorderedIndexPair(nodeId1, nodeId2);
    }
    function varNameDMXP(nodeId1: string, nodeId21: string, nodeId22: string): string {
        const index1 = nodeIndexLookup.get(nodeId1)!;
        return "dmxp_" + index1 + "_" + buildUnorderedIndexPair(nodeId21, nodeId22);
    }
    function varNameDMXN(nodeId1: string, nodeId21: string, nodeId22: string): string {
        const index1 = nodeIndexLookup.get(nodeId1)!;
        return "dmxn_" + index1 + "_" + buildUnorderedIndexPair(nodeId21, nodeId22);
    }
    function addDXVars(n1: string, n2: string): void {
        const nodePair = buildUnorderedIndexPair(n1, n2);
        console.assert(!dxNodes.has(nodePair));
        if (dxNodes.has(nodePair)) return;
        constraints.push([{ [varNameDXP(n1, n2)]: 1, [varNameDXN(n1, n2)]: -1, [varNameX(n1)]: -1, [varNameX(n2)]: 1 }, "=", 0]);
    }
    function addDMXVars(n1: string, n21: string, n22: string): void {
        constraints.push([{ [varNameDMXP(n1, n21, n22)]: 2, [varNameDMXN(n1, n21, n22)]: -2, [varNameX(n1)]: -2, [varNameX(n21)]: 1, [varNameX(n22)]: 1 }, "=", 0]);
    }
    for (const row of rows) {
        for (let j = 0; j < row.length; j++) {
            constraints.push([{ [varNameX(row[j])]: 1 }, ">=", j * nodeWidth]);
            constraints.push([{ [varNameX(row[j])]: 1 }, "<=", xMax]);
            for (let k = 0; k < j; k++) {
                constraints.push([{ [varNameX(row[j])]: 1, [varNameX(row[k])]: -1 }, ">=", (j - k) * nodeWidth]);
            }
            // Make coordinates as small as possible.
            addObjective(varNameX(row[j]), 1);
        }
    }
    for (const [n1, mates] of matesLookup) {
        for (const n2 of mates) {
            if (n1 >= n2) continue;
            addDXVars(n1, n2);
            addObjective(varNameDXP(n1, n2), 20);
            addObjective(varNameDXN(n1, n2), 20);
        }
    }
    for (const [p, children] of childrenLookup) {
        const [p1, p2] = parseUnorderedIdPair(p);
        for (const c of children) {
            if (p2) {
                addDMXVars(c, p1, p2);
                addObjective(varNameDMXP(c, p1, p2), 40);
                addObjective(varNameDMXN(c, p1, p2), 40);
            } else {
                addDXVars(c, p1);
                addObjective(varNameDXP(c, p1), 40);
                addObjective(varNameDXN(c, p1), 40);
            }
        }
    }
    const model = buildJSLPModel({ opType: "min", objective, constraints, intVariables: ints });
    model.options = { timeout: 30000 };
    const solution = Solver.Solve(model);
    if (!solution.feasible) {
        throw new Error("Infeasible model: layoutRow.");
    }
    console.log(solution);
    const result: Record<string, number> = {};
    for (const row of rows) {
        for (const node of row) {
            result[node] = solution[varNameX(node)] || 0;
        }
    }
    return result;
}
