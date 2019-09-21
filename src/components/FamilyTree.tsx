import List from "linked-list";
import * as React from "react";
import wu from "wu";
import { buildUnorderedIdPair } from "../utility/general";
import { ListItem } from "../utility/linkedList";

interface ILayoutNode {
    id: string;
    groupId: number;
    offsetX?: number;
}

function layoutFamilyTree(props: Readonly<IFamilyTree>): ILayoutNode[][] {
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
    const laidoutNodes = new Map<string, ILayoutNode>();
    const rootLayer = arrangeLayer(Array.from(rootCandidates).map<ILayoutNode>(id => ({ id, groupId: 0 })), [[0, 1]]);
    const layers: ILayoutNode[][] = [rootLayer];
    while (true) {
        const lastLayer = layers[layers.length - 1];
        for (const n of lastLayer)
            laidoutNodes.set(n.id, n);
        const seenChildren = new Set<string>();
        const nextLayer: ILayoutNode[] = [];
        const groupBoundaries: [number, number][] = [];
        for (const n of lastLayer) {
            const selfChildren = childrenLookup.get(buildUnorderedIdPair(n.id));
            if (selfChildren) {
                for (const child of selfChildren) {
                    if (!seenChildren.has(child)) {
                        nextLayer.push({ id: child, groupId: groupBoundaries.length });
                        seenChildren.add(child);
                    }
                }
                groupBoundaries.push([n.offsetX!, n.offsetX!]);
            }
            const mates = matesLookup.get(n.id);
            if (mates) {
                for (const mate of mates) {
                    const mateNode = laidoutNodes.get(mate);
                    if (!mateNode) continue;
                    const children = childrenLookup.get(buildUnorderedIdPair(n.id, mate));
                    if (children) {
                        for (const child of children) {
                            if (!seenChildren.has(child)) {
                                nextLayer.push({ id: child, groupId: groupBoundaries.length });
                                seenChildren.add(child);
                            }
                        }
                        groupBoundaries.push([Math.min(n.offsetX!, mateNode.offsetX!), Math.max(n.offsetX!, mateNode.offsetX!)]);
                    }
                }
            }
        }
        if (nextLayer.length === 0) break;
        // console.log("Layer", layers.length);
        const laidoutLayer = arrangeLayer(nextLayer, groupBoundaries);
        layers.push(laidoutLayer);
    }
    return layers;

    function arrangeLayer(nodes: ILayoutNode[], groupBoundaries: [number, number][]): ILayoutNode[] {
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
                        // Assume `node` is on the lhs of `firstIntMate`
                        if (n === firstIntMate) {
                            n.append(firstIntMate.detach());
                            break;
                        }
                        n = n.next;
                    }
                }
                // console.log("Int");
                continue;
            }
        } while (node = nextNode);
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
                        groupStart.data.offsetX = (left + right) / 2;
                        currentX = Math.min(right, currentX + maxItemSpacing);
                    } else if (right >= currentX + minItemSpacing) {
                        groupStart.data.offsetX = (currentX + right) / 2;
                    } else {
                        groupStart.data.offsetX = currentX;
                        currentX += minItemSpacing;
                    }
                } else {
                    let spacing = (right - currentX) / (groupItems - 1);
                    if (spacing < minItemSpacing) {
                        spacing = minItemSpacing;
                    } else if (spacing > maxItemSpacing) {
                        spacing = maxItemSpacing;
                        currentX = (left + right) / 2 - maxItemSpacing * (groupItems - 1) / 2;
                    }
                    let n = groupStart;
                    let i = 0;
                    do {
                        n.data.offsetX = currentX + spacing * i;
                        i++;
                    } while (n = n.next);
                    groupStart = node.next;
                    groupItems = 0;
                    currentX += spacing * groupItems;
                }
            }
        } while (node = node.next);
        return wu.map(n => n.data, nodeList).toArray();
    }
}

// d3.stratify<ICharacterRelationEntry>()
// .id(c => c.subject)
// .parentId(c => c.);
// const tree = d3.tree();

export interface IFamilyTree {
    roots: string[];
    // s - s
    mates: [string, string][];
    // p + p -> c
    children: [string, string | null | undefined, string][];
}

export interface IFamilyTreeProps {
    familyTree: Readonly<IFamilyTree>;
}

export const FamilyTree: React.FC<IFamilyTreeProps> = (props) => {
    const layers = layoutFamilyTree(props.familyTree);
    return (
        <div>
            <pre>{JSON.stringify(layers, undefined, 4)}</pre>
        </div>
    );
};
