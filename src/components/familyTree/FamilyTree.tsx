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
        const drawingHeight = layout.layers.length * (FAMILY_TREE_BOX_HEIGHT + FAMILY_TREE_BOX_SPACING_Y) - FAMILY_TREE_BOX_SPACING_Y;
        const drawing = Svg(this._drawingRoot)
            .size(drawingWidth, drawingHeight)
            .viewbox(-FAMILY_TREE_BOX_WIDTH / 2, 0, drawingWidth + FAMILY_TREE_BOX_WIDTH, drawingHeight);
        const nodeContentRenderQueue: [HTMLElement, React.ReactNode][] = [];
        function getNodeRect(node: ILayoutNode): IRect {
            return {
                left: node.offsetX! * scaleX - FAMILY_TREE_BOX_WIDTH / 2,
                top: node.row * (FAMILY_TREE_BOX_HEIGHT + FAMILY_TREE_BOX_SPACING_Y),
                width: FAMILY_TREE_BOX_WIDTH,
                height: FAMILY_TREE_BOX_HEIGHT
            };
        }
        // Draw nodes.
        for (let rowi = 0; rowi < layout.layers.length; rowi++) {
            const row = layout.layers[rowi];
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
                    drawing.text(`${node.row},${node.column}|${node.groupId}`)
                        .move(bRect.left, bRect.top + bRect.height);
                }
            }
        }
        // Draw connections.
        for (const [mate1, mate2] of layout.mates) {
            const mateNode1 = layout.nodeFromId(mate1);
            const mateNode2 = layout.nodeFromId(mate2);
            console.assert(mateNode1, "Mate node [0] missing", mate1, mate2);
            console.assert(mateNode2, "Mate node [1] missing", mate1, mate2);
            if (!mateNode1 || !mateNode2) continue;
            const mateNodeL = mateNode1.offsetX < mateNode2.offsetX ? mateNode1 : mateNode2;
            const mateNodeR = mateNode1.offsetX < mateNode2.offsetX ? mateNode2 : mateNode1;
            const rectL = getNodeRect(mateNodeL);
            const rectR = getNodeRect(mateNodeR);
            if (mateNodeL.row === mateNodeR.row && mateNodeL.column + 1 === mateNodeR.column) {
                drawing
                    .line(rectL.left + rectL.width, rectL.top + rectL.height / 2,
                        rectR.left, rectR.top + rectR.height / 2)
                    .fill("none")
                    .stroke({ width: 1 });
            } else {
                plotElbow(drawing,
                    rectL.left + rectL.width / 2, rectL.top + rectL.height,
                    Math.max(rectL.top + rectL.height, rectR.top + rectR.height) + FAMILY_TREE_MATE_SLOT_OFFSET,
                    rectR.left + rectR.width / 2, rectR.top + rectR.height)
                    .fill("none")
                    .stroke({ width: 1 });
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

function plotElbow(container: Svg.Container, x1: number, y1: number, y2: number, x3: number, y3: number): Svg.PolyLine {
    return container
        .polyline([x1, y1, x1, y2, x3, y2, x3, y3]);
}
