import List from "linked-list";
import wu, { WuIterable } from "wu";
import { buildUnorderedIdPair, parseUnorderedIdPair } from "../../utility/general";
import { ListItem } from "../../utility/linkedList";
import { IFamilyTree } from "./FamilyTree";

export interface ILayoutNode {
    id: string;
    row: number;
    column: number;
    groupId: number;
    offsetX: number;
}

export interface ILayoutConnection {
    id1: string;
    id2: string;
    slot1: number;
    slot2: number;
}

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

export function layoutFamilyTree(props: Readonly<IFamilyTree>): IFamilyTreeLayoutInfo | null {
    const matesLookup = new Map<string, Set<string>>();
    const childrenLookup = new Map<string, Set<string>>();
    const rootCandidates = new Set<string>();
    for (const [id1, id2] of wu.chain(props.mates,
        wu.filter(t => !!t[1], props.children).map(t => [t[0], t[1]!]))
    ) {
        if (id1 === id2) throw new Error(`Detected self-mating: ${id1}.`);
        let siblings1 = matesLookup.get(id1) || matesLookup.set(id1, new Set()).get(id1)!;
        let siblings2 = matesLookup.get(id2) || matesLookup.set(id2, new Set()).get(id2)!;
        siblings1.add(id2);
        siblings2.add(id1);
        rootCandidates.add(id1).add(id2);
    }
    for (const [id1, id2, id3] of props.children) {
        const key = buildUnorderedIdPair(id1, id2);
        let children = childrenLookup.get(key) || childrenLookup.set(key, new Set()).get(key)!;
        children.add(id3);
        rootCandidates.add(id1);
    }
    for (const [, , id3] of props.children) {
        rootCandidates.delete(id3);
    }
    const freeNodes = new Set<string>();
    for (const id of rootCandidates) {
        const mates = matesLookup.get(id);
        if (mates && wu(mates).every(m => !rootCandidates.has(m))) {
            // If any root candidate only have mates in the rows below, we push it down.
            freeNodes.add(id);
        }
    }
    for (const id of freeNodes)
        rootCandidates.delete(id);
    if (rootCandidates.size === 0) return null;
    const laidoutNodes = new Map<string, ILayoutNode>();
    const row0 = arrangeRow(wu(rootCandidates)
        .map<ILayoutNode>(id => ({
            id, groupId: 0,
            offsetX: NaN,
            row: 0,
            column: NaN
        })).toArray(), matesLookup);
    const rows: ILayoutNode[][] = [row0];
    // Start node index, End node index
    const rowGroupBoundaries: [undefined, ...[ILayoutNode, ILayoutNode][][]] = [undefined];
    const mateConnections: ILayoutConnection[] = [];
    while (true) {
        const prevRow = rows[rows.length - 1];
        for (const n of prevRow)
            laidoutNodes.set(n.id, n);
        const seenChildren = new Set<string>();
        const nextRow: ILayoutNode[] = [];
        const groupBoundaries: [ILayoutNode, ILayoutNode][] = [];
        for (const n of prevRow) {
            for (const mate of wu.chain([undefined], matesLookup.get(n.id) || [])) {
                const mateNode = mate && laidoutNodes.get(mate);
                if (mate && !mateNode) continue;
                const children = childrenLookup.get(buildUnorderedIdPair(n.id, mate));
                if (children) {
                    for (const child of children) {
                        if (seenChildren.has(child)) continue;
                        const childMates = matesLookup.get(child);
                        let newNodeIds: string[] | undefined;
                        if (childMates) {
                            newNodeIds = wu(childMates).filter(m => freeNodes.has(m)).toArray();
                            for (const m of newNodeIds) {
                                freeNodes.delete(m);
                            }
                        }
                        if (!newNodeIds || newNodeIds.length === 0)
                            newNodeIds = [child];
                        else
                            newNodeIds.splice(1, 0, child);
                        for (const id of newNodeIds) {
                            nextRow.push({
                                id,
                                groupId: groupBoundaries.length,
                                offsetX: NaN,
                                row: rows.length,
                                column: NaN
                            });
                        }
                        seenChildren.add(child);
                    }
                    if (mateNode)
                        groupBoundaries.push([n, mateNode]);
                    else
                        groupBoundaries.push([n, n]);
                }
            }
        }
        if (nextRow.length === 0) break;
        // console.log("row", rows.length);
        const laidoutRow = arrangeRow(nextRow, matesLookup);
        rows.push(laidoutRow);
        rowGroupBoundaries.push(groupBoundaries);
    }
    // const baselineRowIndex = rows.reduce((p, c, i) => rows[p].length >= c.length ? p : i, 0);
    const baselineRowIndex = 0;
    const nodeSpacing = rows[baselineRowIndex].length < 3 ? 0.5 : 1 / (rows[baselineRowIndex].length + 1);
    rows[baselineRowIndex].forEach((n, i) => { n.offsetX = nodeSpacing / 2 + nodeSpacing * i; });
    let rawWidth: number = rows[baselineRowIndex][rows[baselineRowIndex].length - 1].offsetX;
    for (let i = baselineRowIndex + 1; i < rows.length; i++) {
        const groupBoundaries: [number, number][] = rowGroupBoundaries[i]!.map(([n1, n2]) => [n1.offsetX, n2.offsetX]);
        layoutRow(rows[i], groupBoundaries, nodeSpacing);
        rawWidth = Math.max(rawWidth, rows[i][rows[i].length - 1].offsetX);
    }
    const arrangedNodes = new Set<string>();
    const occupiedSlotsMap = new Map<string, boolean[]>();
    function findVacantSlot(ids: Iterable<string>): number {
        const slots = wu(ids).map(id => occupiedSlotsMap.get(id)).filter(s => !!s).toArray() as boolean[][];
        return wu.count(1).find(i => slots.every(s => !s[i]))!;
    }
    function declareSlotOccupied(id: string, slotIndex: number): void {
        const slots = occupiedSlotsMap.get(id) || occupiedSlotsMap.set(id, []).get(id)!;
        console.assert(!slots[slotIndex]);
        slots[slotIndex] = true;
    }
    for (const row of rows) {
        // Layout connections
        // internal representation: slot index increases as slot goes above.
        // Bottom-most has the smallest index (1).
        // 0 means the connection can be drawn directly from sibling node to sibling node.
        for (let i = 0; i < row.length; i++) {
            const node = row[i];
            const mates = matesLookup.get(node.id);
            if (!mates) continue;
            const prev = i > 0 ? row[i - 1] : undefined;
            const next = i < row.length - 1 ? row[i + 1] : undefined;
            const occupiedSlots = occupiedSlotsMap.get(node.id) || occupiedSlotsMap.set(node.id, []).get(node.id)!;
            for (const mate of mates) {
                if (arrangedNodes.has(mate)) continue;
                if (!occupiedSlots[0]) {
                    if (next && next.id === mate) {
                        mateConnections.push({ id1: node.id, id2: mate, slot1: 0, slot2: 0 });
                        occupiedSlots[0] = true;
                        continue;
                    }
                }
                const mateNode = laidoutNodes.get(mate);
                // The row has not been laid out yet.
                if (!mateNode) continue;
                const lNode = node.offsetX <= mateNode.offsetX ? node : mateNode;
                const rNode = node.offsetX <= mateNode.offsetX ? mateNode : node;
                if (node.row === mateNode.row) {
                    console.assert(lNode.column <= rNode.column);
                    // Same row
                    const slot = findVacantSlot(wu(row).slice(lNode.column, rNode.column + 1).map(r => r.id));
                    mateConnections.push({ id1: node.id, id2: mate, slot1: slot, slot2: slot });
                    wu(row)
                        .slice(lNode.column, rNode.column)
                        .forEach(n => declareSlotOccupied(n.id, slot));
                } else {
                    console.assert(mateNode.row < node.row);
                    const row1 = rows[lNode.row];
                    const row2 = rows[rNode.row];
                    const slot1 = findVacantSlot(wu(row1).filter(n => n.column >= lNode.column && n.offsetX < rNode.offsetX).map(r => r.id));
                    const slot2 = findVacantSlot([rNode.id]);
                    mateConnections.push({ id1: lNode.id, id2: rNode.id, slot1, slot2 });
                    wu(row1)
                        .filter(n => n.column >= lNode.column && n.offsetX < rNode.offsetX)
                        .forEach(n => declareSlotOccupied(n.id, slot1));
                    declareSlotOccupied(rNode.id, slot2);
                }
            }
            arrangedNodes.add(node.id);
        }
    }
    return {
        rows: rows,
        rootNodeCount: row0.length,
        rowSlotCount: rows.map(row => row.reduce((p, n) => Math.max(p, (occupiedSlotsMap.get(n.id) || []).length - 1), 0)),
        rawWidth, minNodeSpacingX: nodeSpacing,
        mateConnections,
        nodeFromId: id => laidoutNodes.get(id),
        children: wu(childrenLookup).map(([p, c]) => {
            const [p1, p2] = parseUnorderedIdPair(p);
            return [p1, p2, c];
        })
    };
}

function arrangeRow(nodes: ILayoutNode[], matesLookup: Map<string, Set<string>>): ILayoutNode[] {
    if (nodes.length < 2) {
        return nodes;
    }
    const nodeList = List.from(wu.map(n => new ListItem(n), nodes));
    const nodesMap = new Map<string, ListItem<ILayoutNode>>(wu.map(n => [n.data.id, n], nodeList));
    // const arrangedNodes_DEBUG = new Set<string>();
    const arrangedNodes = new Set<string>();
    let node = nodeList.head!;
    let nextNode: typeof node | null | undefined;
    do {
        // console.log(node.data);
        nextNode = node.next;
        if (arrangedNodes.has(node.data.id)) continue;
        // if (arrangedNodes_DEBUG.has(node.data.id) && node.next && node.next.data.groupId === node.data.groupId)
        //     throw new Error("Detected loop in iteration.");
        // arrangedNodes_DEBUG.add(node.data.id);
        const mates = matesLookup.get(node.data.id);
        if (!mates) continue;
        const mateNodes = wu.map(m => nodesMap.get(m), mates).filter(m => !!m).toArray() as ListItem<ILayoutNode>[];
        const firstExtMate = mateNodes.find(m => m.data.groupId > node.data.groupId);
        if (firstExtMate) {
            // Move external mates closer.
            // Move `node` right.
            if (node.next && node.next.data.groupId === node.data.groupId) {
                let n = node.next;
                while (n.next && n.next.data.groupId === node.data.groupId)
                    n = n.next;
                n.append(node.detach());
                // Mark this node as visited becuase we moved it to the right.
                arrangedNodes.add(node.data.id);
            }
            // Move `firstExtMate` left.
            if (firstExtMate.prev && firstExtMate.prev.data.groupId === firstExtMate.data.groupId) {
                let n = firstExtMate;
                while (n.prev && n.prev.data.groupId === firstExtMate.data.groupId)
                    n = n.prev;
                if (n !== firstExtMate) n.prepend(firstExtMate.detach());
            }
            // console.log("Ext");
            continue;
        }
        const firstIntMate = mateNodes.find(m => m.data.groupId === node.data.groupId);
        console.assert(firstIntMate !== node);
        if (firstIntMate) {
            // Move interal mates closer.
            if (node.next !== firstIntMate && node.prev !== firstIntMate) {
                let n = node;
                while (n.next && n.next.data.groupId === node.data.groupId) {
                    if (n === firstIntMate) {
                        // `node` is on the lhs of `firstIntMate`
                        node.append(firstIntMate.detach());
                        break;
                    }
                    n = n.next;
                }
            }
            // console.log("Int");
            continue;
        }
    } while (node = nextNode);
    console.assert(nodeList.size === nodes.length);
    const laidoutNodes = wu(nodeList).map(n => n.data).toArray();
    laidoutNodes.forEach((n, i) => n.column = i);
    return laidoutNodes;
}

function layoutRow(nodes: ILayoutNode[], groupBoundaries: [number, number][], spacing: number): void {
    if (nodes.length === 0) {
        return;
    }
    if (nodes.length === 1) {
        nodes[0].offsetX = (groupBoundaries[0][0] + groupBoundaries[0][1]) / 2;
        return;
    }
    // Layout offsetX
    let groupStartIndex = 0;
    let currentX = 0;
    let normalizedItemSpacing = spacing;
    let minItemSpacing = normalizedItemSpacing * 0.8;
    let maxItemSpacing = normalizedItemSpacing * 1.5;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const next = nodes[i + 1];
        if (!next || next.groupId !== node.groupId) {
            if (node.groupId >= groupBoundaries.length)
                throw new RangeError("groupId out of range.");
            const groupItems = i - groupStartIndex + 1;
            const [left, right] = groupBoundaries[node.groupId];
            if (groupItems === 1) {
                if (left >= currentX) {
                    currentX = node.offsetX = (left + right) / 2;
                } else if (right >= currentX + minItemSpacing) {
                    currentX = node.offsetX = (currentX + right) / 2;
                } else {
                    node.offsetX = currentX;
                }
                currentX += normalizedItemSpacing;
            } else {
                let spacing = (right - currentX) / (groupItems - 1);
                if (spacing < minItemSpacing) {
                    spacing = minItemSpacing;
                } else if (spacing > maxItemSpacing) {
                    spacing = maxItemSpacing;
                    let centeredX = (left + right) / 2 - maxItemSpacing * (groupItems - 1) / 2;
                    if (centeredX >= currentX) {
                        currentX = centeredX;
                    } else {
                        currentX = (currentX + right) / 2 - maxItemSpacing * (groupItems - 1) / 2;
                    }
                }
                for (let j = groupStartIndex; j <= i; j++)
                    nodes[j].offsetX = currentX + spacing * (j - groupStartIndex);
                currentX += spacing * (groupItems - 1) + normalizedItemSpacing;
            }
            groupStartIndex = i + 1;
        }
    }
}
