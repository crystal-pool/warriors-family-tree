import _ from "lodash";
import * as React from "react";
import ReactDOM from "react-dom";
import Svg from "svgjs";
import { ILayoutNode, layoutFamilyTree } from "./layout";

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
    debugInfo?: boolean;
}

const FAMILY_TREE_BOX_WIDTH = 100;
const FAMILY_TREE_BOX_HEIGHT = 50;
const FAMILY_TREE_BOX_SPACING_X = 50;
const FAMILY_TREE_BOX_SPACING_Y = 50;
const FAMILY_TREE_MATE_SLOT_OFFSET = 10;

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
        const rowTop: number[] = [0];
        for (let row = 0; row < layout.rows.length; row++) {
            rowTop.push(rowTop[row] + layout.rowSlotCount[row] * FAMILY_TREE_MATE_SLOT_OFFSET + FAMILY_TREE_BOX_HEIGHT + FAMILY_TREE_BOX_SPACING_Y);
        }
        const drawingHeight = rowTop[rowTop.length - 1];
        const drawing = Svg(this._drawingRoot)
            .size(drawingWidth, drawingHeight)
            .viewbox(-FAMILY_TREE_BOX_WIDTH / 2, 0, drawingWidth + FAMILY_TREE_BOX_WIDTH, drawingHeight);
        const nodeContentRenderQueue: [HTMLElement, React.ReactNode][] = [];
        function getNodeRect(node: ILayoutNode): IRect {
            return {
                left: node.offsetX! * scaleX - FAMILY_TREE_BOX_WIDTH / 2,
                top: rowTop[node.row],
                width: FAMILY_TREE_BOX_WIDTH,
                height: FAMILY_TREE_BOX_HEIGHT
            };
        }
        // Draw nodes.
        for (let rowi = 0; rowi < layout.rows.length; rowi++) {
            const row = layout.rows[rowi];
            for (let coli = 0; coli < row.length; coli++) {
                const node = row[coli];
                const bRect: IRect = getNodeRect(node);
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
                if (this.props.debugInfo) {
                    const lines = [`${node.row},${node.column}|${node.groupId}`];
                    for (const { id1, id2, slot1, slot2 } of layout.mateConnections) {
                        if (id1 !== node.id && id2 !== node.id) continue;
                        lines.push(`${id1} -- ${id2} | ${slot1} -- ${slot2}`);
                    }
                    drawing.text(lines.join("\n"))
                        .font({ size: 9 })
                        .move(bRect.left, bRect.top + bRect.height);
                }
            }
        }
        // Draw connections.
        for (const { id1, id2, slot1, slot2 } of layout.mateConnections) {
            const node1 = layout.nodeFromId(id1);
            const node2 = layout.nodeFromId(id2);
            console.assert(node1, "Mate node [0] missing", id1, id2);
            console.assert(node2, "Mate node [1] missing", id1, id2);
            if (!node1 || !node2) continue;
            const nodeL = node1.offsetX < node2.offsetX ? node1 : node2;
            const nodeR = node1.offsetX < node2.offsetX ? node2 : node1;
            const rectL = getNodeRect(nodeL);
            const rectR = getNodeRect(nodeR);
            const slotL = nodeL === node1 ? slot1 : slot2;
            const slotR = nodeR === node1 ? slot1 : slot2;
            if (slotL === 0 && slotR === 0) {
                drawing
                    .line(rectL.left + rectL.width, rectL.top + rectL.height / 2,
                        rectR.left, rectR.top + rectR.height / 2)
                    .fill("none")
                    .stroke({ width: 1 });
            } else {
                if (nodeL.row === nodeR.row) {
                    const slotYL = rectL.top + rectL.height + slotL * FAMILY_TREE_MATE_SLOT_OFFSET;
                    const slotYR = rectR.top + rectL.height + slotR * FAMILY_TREE_MATE_SLOT_OFFSET;
                    plotElbowHorizontal(drawing,
                        rectL.left + rectL.width / 2, rectL.top + rectL.height,
                        slotYL,
                        rectR.left + rectR.width / 2, rectR.top + rectR.height)
                        .fill("none")
                        .stroke({ width: 1 });
                } else {
                    const nodeU = node1.row < node2.row ? node1 : node2;
                    const nodeD = node1.row < node2.row ? node2 : node1;
                    const rectU = nodeU === nodeL ? rectL : rectR;
                    const slotU = nodeU === nodeL ? slotL : slotR;
                    const slotYU = rectU.top + rectU.height + slotU * FAMILY_TREE_MATE_SLOT_OFFSET;
                    const edgeXL = rectL.left + rectL.width + FAMILY_TREE_MATE_SLOT_OFFSET;
                    const edgeYL = rectL.top + rectL.height / 2;
                    const edgeXR = rectR.left - FAMILY_TREE_MATE_SLOT_OFFSET;
                    const edgeYR = rectR.top + rectR.height / 2;
                    drawing.polyline([
                        rectL.left + rectL.width, edgeYL,
                        edgeXL, edgeYL,
                        edgeXL, slotYU,
                        edgeXR, slotYU,
                        edgeXR, edgeYR,
                        rectR.left, edgeYR
                    ]).fill("none")
                        .stroke({ width: 1 });
                }
            }
        }
        // Mount React.
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

function plotElbowHorizontal(container: Svg.Container, x1: number, y1: number, y2: number, x3: number, y3: number): Svg.PolyLine {
    return container
        .polyline([x1, y1, x1, y2, x3, y2, x3, y3]);
}

function plotElbowVertical(container: Svg.Container, x1: number, y1: number, x2: number, x3: number, y3: number): Svg.PolyLine {
    return container
        .polyline([x1, y1, x2, y1, x2, y3, x3, y3]);
}
