import List from "linked-list";
import _ from "lodash";
import * as React from "react";
import ReactDOM from "react-dom";
import Svg, { Rect } from "svgjs";
import wu from "wu";
import { buildUnorderedIdPair } from "../utility/general";
import { ListItem } from "../utility/linkedList";

export interface IFamilyTree {
    roots: string[];
    // s - s
    mates: [string, string][];
    // p + p -> c
    children: [string, string | null | undefined, string][];
}

export interface IRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export type NodeRenderCallback = (id: string, boundingRect: Readonly<IRect>) => React.ReactNode;

export interface IFamilyTreeProps {
    familyTree: Readonly<IFamilyTree>;
    onRenderNode?: NodeRenderCallback;
}

const FAMILY_TREE_BOX_WIDTH = 100;
const FAMILY_TREE_BOX_HEIGHT = 50;
const FAMILY_TREE_BOX_SPACING_X = 50;
const FAMILY_TREE_BOX_SPACING_Y = 50;

export class FamilyTree extends React.PureComponent<IFamilyTreeProps> {
    private static defaultProps: Partial<IFamilyTreeProps> = {
        onRenderNode(id, brct): React.ReactNode {
            return id;
        }
    };
    private _drawingRoot: HTMLDivElement | null | undefined;
    private _drawingReactRoot: HTMLElement | undefined;
    public constructor(props: IFamilyTreeProps) {
        super(props);
        this._updateDrawing = _.debounce(this._updateDrawing, 100);
    }
    private _updateDrawing = (): void => {
        // Cleanup
        if (this._drawingReactRoot) {
            ReactDOM.unmountComponentAtNode(this._drawingReactRoot);
            this._drawingReactRoot = undefined;
        }
        if (!this._drawingRoot) return;
        while (this._drawingRoot.hasChildNodes())
            this._drawingRoot.firstChild!.remove();
        // Render
        const layout = layoutFamilyTree(this.props.familyTree);
        if (!layout) return;
        const rootScaleX = (FAMILY_TREE_BOX_WIDTH + FAMILY_TREE_BOX_SPACING_X) * layout.rootNodeCount - FAMILY_TREE_BOX_SPACING_X;
        const minSpacingScaleX = (FAMILY_TREE_BOX_WIDTH + FAMILY_TREE_BOX_SPACING_X) / layout.minNodeSpacingX;
        const scaleX = minSpacingScaleX * 0.8 + rootScaleX * 0.2;
        const drawingWidth = layout.rawWidth * scaleX;
        const drawingHeight = layout.layers.length * (FAMILY_TREE_BOX_HEIGHT + FAMILY_TREE_BOX_SPACING_Y) - FAMILY_TREE_BOX_SPACING_Y;
        const drawing = Svg(this._drawingRoot)
            .size(drawingWidth, drawingHeight)
            .viewbox(-FAMILY_TREE_BOX_WIDTH / 2, 0, drawingWidth + FAMILY_TREE_BOX_WIDTH, drawingHeight);
        const nodeContentRenderQueue: [HTMLElement, React.ReactNode][] = [];
        for (let rowi = 0; rowi < layout.layers.length; rowi++) {
            const row = layout.layers[rowi];
            const rowTop = rowi * (FAMILY_TREE_BOX_HEIGHT + FAMILY_TREE_BOX_SPACING_Y);
            for (let coli = 0; coli < row.length; coli++) {
                const node = row[coli];
                const bRect: IRect = {
                    left: node.offsetX! * scaleX - FAMILY_TREE_BOX_WIDTH / 2,
                    top: rowTop,
                    width: FAMILY_TREE_BOX_WIDTH,
                    height: FAMILY_TREE_BOX_HEIGHT
                };
                drawing.rect(bRect.width, bRect.height)
                    .move(bRect.left, bRect.top)
                    .fill("none")
                    .stroke("none");
                if (this.props.onRenderNode) {
                    const renderedNode = this.props.onRenderNode(node.id, bRect);
                    if (renderedNode) {
                        const container = drawing
                            .element("foreignObject")
                            .move(bRect.left, bRect.top)
                            .size(bRect.width, bRect.height);
                        nodeContentRenderQueue.push([container.native(), renderedNode]);
                    }
                }
            }
        }
        const reactPortalDomRoot = document.createElement("div");
        this._drawingRoot.appendChild(reactPortalDomRoot);
        const mergedComponent = nodeContentRenderQueue.map(([container, reactRoot], i) =>
            ReactDOM.createPortal(reactRoot, container));
        ReactDOM.render(<React.Fragment>{mergedComponent}</React.Fragment>, reactPortalDomRoot);
        this._drawingReactRoot = reactPortalDomRoot;
    }
    private _onDrawingRootChanged = (root: HTMLDivElement | null): void => {
        this._drawingRoot = root;
        if (!root) return;
        this._updateDrawing();
    }
    public render(): React.ReactNode {
        return (<React.Fragment><div ref={this._onDrawingRootChanged} className="family-tree-drawing"></div></React.Fragment>);
    }
    public componentDidUpdate(prevProps: IFamilyTreeProps) {
        if (prevProps.familyTree !== this.props.familyTree) {
            this._updateDrawing();
        }
    }
}

interface ILayoutNode {
    id: string;
    groupId: number;
    offsetX?: number;
}

interface IFamilyTreeLayoutInfo {
    layers: ILayoutNode[][];
    rootNodeCount: number;
    rawWidth: number;
    minNodeSpacingX: number;
}

function layoutFamilyTree(props: Readonly<IFamilyTree>): IFamilyTreeLayoutInfo | null {
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
    if (rootCandidates.size === 0) return null;
    const laidoutNodes = new Map<string, ILayoutNode>();
    const rootLayer = arrangeLayer(Array.from(rootCandidates).map<ILayoutNode>(id => ({ id, groupId: 0 })), [[0, 1]]);
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
        rawWidth = Math.max(rawWidth, laidoutLayer[laidoutLayer.length - 1].offsetX!);
        if (laidoutLayer.length > 1) {
            minNodeSpacingX = wu.zip(laidoutLayer, wu(laidoutLayer).slice(1))
                .reduce((spacing, [prev, cur]) => Math.min(spacing, cur.offsetX! - prev.offsetX!), minNodeSpacingX);
            console.assert(minNodeSpacingX >= 0);
        }
        layers.push(laidoutLayer);
    }
    return { layers, rootNodeCount: rootLayer.length, rawWidth, minNodeSpacingX };

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
        return wu.map(n => n.data, nodeList).toArray();
    }
}
