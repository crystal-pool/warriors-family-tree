import List from "linked-list";
import wu, { WuIterable } from "wu";
import { buildUnorderedIdPair, parseUnorderedIdPair } from "../../utility/general";
import { ListItem } from "../../utility/linkedList";
import { IFamilyTree } from "./FamilyTree";

export interface ILayoutNode {
    id: string;
    groupId: number;
    offsetX: number;
    row: number;
    column: number;
}

export interface IFamilyTreeLayoutInfo {
    layers: ILayoutNode[][];
    rootNodeCount: number;
    rawWidth: number;
    minNodeSpacingX: number;
    nodeFromId(id: string): ILayoutNode | undefined;
    mates: Iterable<[string, string]>;
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
    const rootLayer = arrangeLayer(wu(rootCandidates)
        .map<ILayoutNode>(id => ({
            id, groupId: 0,
            offsetX: NaN,
            row: 0,
            column: NaN
        })).toArray(), [[0, 1]], matesLookup);
    const layers: ILayoutNode[][] = [rootLayer];
    let rawWidth: number = 1;
    let minNodeSpacingX: number = rawWidth / rootLayer.length;
    while (true) {
        const lastLayer = layers[layers.length - 1];
        for (const n of lastLayer)
            laidoutNodes.set(n.id, n);
        const seenChildren = new Set<string>();
        const nextLayer: ILayoutNode[] = [];
        const groupBoundaries: [number, number][] = [];
        for (const n of lastLayer) {
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
                            nextLayer.push({
                                id,
                                groupId: groupBoundaries.length,
                                offsetX: NaN,
                                row: layers.length,
                                column: NaN
                            });
                        }
                        seenChildren.add(child);
                    }
                    if (mateNode)
                        groupBoundaries.push([Math.min(n.offsetX!, mateNode.offsetX!), Math.max(n.offsetX!, mateNode.offsetX!)]);
                    else
                        groupBoundaries.push([n.offsetX!, n.offsetX!]);
                }
            }
        }
        if (nextLayer.length === 0) break;
        // console.log("Layer", layers.length);
        const laidoutLayer = arrangeLayer(nextLayer, groupBoundaries, matesLookup);
        rawWidth = Math.max(rawWidth, laidoutLayer[laidoutLayer.length - 1].offsetX!);
        if (laidoutLayer.length > 1) {
            minNodeSpacingX = wu.zip(laidoutLayer, wu(laidoutLayer).slice(1))
                .reduce((spacing, [prev, cur]) => Math.min(spacing, cur.offsetX! - prev.offsetX!), minNodeSpacingX);
            console.assert(minNodeSpacingX >= 0);
        }
        layers.push(laidoutLayer);
    }
    return {
        layers,
        rootNodeCount: rootLayer.length,
        rawWidth, minNodeSpacingX,
        nodeFromId: id => laidoutNodes.get(id),
        mates: wu(matesLookup).map(([m1, m2s]) => wu(m2s).filter(m2 => m2 >= m1).map(m2 => [m1, m2])).flatten(true) as WuIterable<[string, string]>,
        children: wu(childrenLookup).map(([p, c]) => {
            const [p1, p2] = parseUnorderedIdPair(p);
            return [p1, p2, c];
        })
    };
}

function arrangeLayer(nodes: ILayoutNode[], groupBoundaries: [number, number][], matesLookup: Map<string, Set<string>>): ILayoutNode[] {
    if (nodes.length === 0) {
        return nodes;
    } else if (nodes.length === 1) {
        nodes[0].offsetX = (groupBoundaries[0][0] + groupBoundaries[0][1]) / 2;
        return nodes;
    }
    const nodeList = List.from(wu.map(n => new ListItem(n), nodes));
    const layerNodesMap = new Map<string, ListItem<ILayoutNode>>(wu.map(n => [n.data.id, n], nodeList));
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
        const mateNodes = wu.map(m => layerNodesMap.get(m), mates).filter(m => !!m).toArray() as ListItem<ILayoutNode>[];
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
    // Layout
    node = nodeList.head!;
    let groupStart = node;
    let groupItems = 0;
    let currentX = 0;
    let normalizedItemSpacing = 1 / nodes.length;
    let minItemSpacing = normalizedItemSpacing / 2;
    let maxItemSpacing = normalizedItemSpacing * 1.5;
    do {
        groupItems++;
        if (!node.next || node.next.data.groupId !== node.data.groupId) {
            if (node.data.groupId >= groupBoundaries.length)
                throw new RangeError("groupId out of range.");
            const [left, right] = groupBoundaries[node.data.groupId];
            if (groupItems === 1) {
                if (left >= currentX) {
                    currentX = (left + right) / 2;
                    groupStart.data.offsetX = currentX;
                } else if (right >= currentX + minItemSpacing) {
                    currentX += (currentX + right) / 2;
                    groupStart.data.offsetX = currentX;
                } else {
                    groupStart.data.offsetX = currentX;
                }
                currentX += minItemSpacing;
            } else {
                let spacing = (right - currentX) / (groupItems - 1);
                if (spacing < minItemSpacing) {
                    spacing = minItemSpacing;
                } else if (spacing > maxItemSpacing) {
                    spacing = maxItemSpacing;
                    currentX = (currentX + right) / 2 - maxItemSpacing * (groupItems - 1) / 2;
                }
                let n = groupStart;
                let i = 0;
                do {
                    n.data.offsetX = currentX + spacing * i;
                    i++;
                } while (n = n.next);
                currentX += spacing * groupItems;
            }
            groupStart = node.next;
            groupItems = 0;
        }
    } while (node = node.next);
    const arrangedArray = wu.map(n => n.data, nodeList).toArray();
    console.assert(arrangedArray.length === nodes.length);
    arrangedArray.forEach((n, i) => n.column = i);
    return arrangedArray;
}
