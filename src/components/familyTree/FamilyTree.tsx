import classNames from "classnames";
import _ from "lodash";
import * as React from "react";
import Svg from "svgjs";
import { dataService } from "../../services";
import { RdfQName } from "../../services/dataService";
import scss from "./FamilyTree.scss";
import { ILayoutNode, IRect, ISize, layoutFamilyTree } from "./layout";

export interface IFamilyTreeData {
    roots: string[];
    // s - s
    mates: [string, string][];
    // p + p -> c
    children: [string, string | null | undefined, string][];
}

export type NodeRenderCallback = (id: string, boundingRect: Readonly<IRect>) => React.ReactNode;

export interface IFamilyTreeProps {
    className?: string;
    familyTree: Readonly<IFamilyTreeData>;
    nodeSpacingX?: number;
    nodeSpacingY?: number;
    onRenderNode?: NodeRenderCallback;
    debugInfo?: boolean;
    onEvalNodeDimension?: (id: string) => ISize;
    onRendered?: (sender: FamilyTree) => void;
}

const FAMILY_TREE_MATE_SLOT_OFFSET = 10;

export class FamilyTree extends React.PureComponent<IFamilyTreeProps> {
    public static defaultProps: Partial<IFamilyTreeProps> = {
        onEvalNodeDimension(id) {
            // Fixed dimension by default.
            return { width: 130, height: 50 };
        },
        onRenderNode(id, brct): React.ReactNode {
            return id;
        }
    };
    private _drawingRoot: HTMLDivElement | null | undefined;
    private _overlayDomRoot = React.createRef<HTMLDivElement>();
    private _nodeContainers: React.ReactNode[] = [];
    // nodeId --> internalNodeId
    private _nodeInternalIdMap = new Map<string, number>();
    private _pendingOnRenderedCall = false;
    private _nodeRects = new Map<string, Readonly<IRect>>();
    public constructor(props: IFamilyTreeProps) {
        super(props);
        this._updateDrawing = _.debounce(this._updateDrawing, 100);
    }
    private _updateDrawing = (): void => {
        // console.log(dumpFamilyTreeData(this.props.familyTree));
        if (!this._drawingRoot) return;
        this._pendingOnRenderedCall = true;
        this._nodeRects.clear();
        this._nodeContainers = [];
        this._nodeInternalIdMap.clear();
        while (this._drawingRoot.hasChildNodes())
            this._drawingRoot.firstChild!.remove();
        // Render
        const layout = layoutFamilyTree(this.props.familyTree, this.props.onEvalNodeDimension!);
        if (!layout) return;
        const FAMILY_TREE_BOX_SPACING_Y = this.props.nodeSpacingY == null ? 20 : this.props.nodeSpacingY;
        const drawingWidth = layout.rawWidth;
        // [top, height]
        const rowDimension: [number, number][] = [];
        const rowSlotTop: number[] = [];
        let drawingHeight: number | undefined;
        {
            let currentY = 0;
            for (let row = 0; row < layout.rows.length; row++) {
                if (row > 0) currentY += FAMILY_TREE_BOX_SPACING_Y;
                const nodeHeight = layout.rows[row].reduce((p, n) => Math.max(p, n.height), 0);
                rowDimension.push([currentY, nodeHeight]);
                rowSlotTop.push(currentY + nodeHeight + FAMILY_TREE_MATE_SLOT_OFFSET);
                currentY += nodeHeight + layout.rowSlotCount[row] * FAMILY_TREE_MATE_SLOT_OFFSET;
            }
            drawingHeight = currentY;
        }
        // Note the px in svg represents a physical length.
        const drawing = Svg(this._drawingRoot)
            .size(drawingWidth, drawingHeight)
            .viewbox(0, 0, drawingWidth, drawingHeight);
        function getNodeRect(node: ILayoutNode): IRect {
            const [rowTop, rowHeight] = rowDimension[node.row];
            return {
                left: node.offsetX - node.width / 2,
                top: rowTop + (rowHeight - node.height) / 2,
                width: node.width,
                height: node.height
            };
        }
        function getSlotY(node: ILayoutNode, slotIndex: number): number {
            if (slotIndex === 0) {
                const rect = getNodeRect(node);
                return rect.top + rect.height / 2;
            }
            return rowSlotTop[node.row] + FAMILY_TREE_MATE_SLOT_OFFSET * (slotIndex - 1);
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
                    this._nodeRects.set(node.id, bRect);
                    const renderedNode = this.props.onRenderNode(node.id, bRect);
                    if (renderedNode) {
                        const internalId = this._nodeInternalIdMap.size + 1;
                        this._nodeInternalIdMap.set(node.id, internalId);
                        const container = (<div key={node.id}
                            className={scss.nodeContainer}
                            style={{ ...bRect }}
                            data-node-id={internalId}>{renderedNode}</div>);
                        this._nodeContainers.push(container);
                    }
                }
                if (this.props.debugInfo) {
                    const lines = [`${node.row},${node.column} (${Math.round(node.offsetX * 10) / 10})`];
                    for (const connection of layout.connections) {
                        if ("id2" in connection) {
                            const { id1, id2, slot1, childrenSlot } = connection;
                            if (id1 !== node.id && id2 !== node.id) continue;
                            lines.push(`${id1} -- ${id2} | S${slot1}${childrenSlot && (" | CS" + childrenSlot) || ""}`);
                        } else {
                            const { id1, childrenSlot } = connection;
                            if (id1 !== node.id) continue;
                            lines.push(`${id1} | ${childrenSlot && (" | CS" + childrenSlot) || ""}`);
                        }
                    }
                    drawing.text(lines.join("\n"))
                        .font({ size: 9 })
                        .move(bRect.left, bRect.top + bRect.height);
                }
            }
        }
        // Draw connections.
        for (const connection of layout.connections) {
            if ("id2" in connection) {
                // ICoupleLayoutConnection
                const { id1, id2, slot1, childrenId, childrenSlot } = connection;
                const node1 = layout.nodeFromId(id1);
                const node2 = layout.nodeFromId(id2);
                console.assert(node1, "Mate node [0] missing", id1, id2);
                console.assert(node2, "Mate node [1] missing", id1, id2);
                if (!node1 || !node2) continue;
                const nodeL = node1.offsetX < node2.offsetX ? node1 : node2;
                const nodeR = node1.offsetX < node2.offsetX ? node2 : node1;
                const rectL = getNodeRect(nodeL);
                const rectR = getNodeRect(nodeR);
                console.assert((childrenId == null) == (childrenSlot == null));
                if (slot1 === 0) {
                    const mateLineY = rectL.top + rectL.height / 2;
                    drawing
                        .line(rectL.left + rectL.width, mateLineY, rectR.left, mateLineY)
                        .addClass(classNames(scss.familyTreeConnection, scss.familyTreeConnectionMate));
                    if (childrenId && childrenSlot) {
                        const centerX = ((rectL.left + rectL.width) + rectR.left) / 2;
                        for (const childId of childrenId) {
                            const nodeC = layout.nodeFromId(childId)!;
                            const rectC = getNodeRect(nodeC);
                            plotElbowHorizontal(drawing,
                                centerX, mateLineY,
                                getSlotY(nodeL, childrenSlot),
                                rectC.left + rectC.width / 2, rectC.top
                            ).addClass(classNames(scss.familyTreeConnection, scss.familyTreeConnectionChild));
                        }
                    }
                } else if (nodeL.row === nodeR.row) {
                    const slotY = getSlotY(nodeL, slot1);
                    plotElbowHorizontal(drawing,
                        rectL.left + rectL.width / 2, rectL.top + rectL.height,
                        slotY,
                        rectR.left + rectR.width / 2, rectR.top + rectR.height
                    ).addClass(classNames(scss.familyTreeConnection, scss.familyTreeConnectionMate));
                    if (childrenId && childrenSlot) {
                        const startX = ((rectL.left + rectL.width) + rectR.left) / 2;
                        for (const childId of childrenId) {
                            const nodeC = layout.nodeFromId(childId)!;
                            const rectC = getNodeRect(nodeC);
                            plotElbowHorizontal(drawing,
                                startX, slotY,
                                getSlotY(nodeL, childrenSlot),
                                rectC.left + rectC.width / 2, rectC.top
                            ).addClass(classNames(scss.familyTreeConnection, scss.familyTreeConnectionChild));
                        }
                    }
                } else {
                    console.assert(node1.row < node2.row);
                    const nodeU = node1;
                    const nodeD = node2;
                    const rectD = nodeD === nodeL ? rectL : rectR;
                    const slotYU = getSlotY(nodeU, slot1);
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
                    ]).addClass(classNames(scss.familyTreeConnection, scss.familyTreeConnectionMate));
                    if (childrenId && childrenSlot) {
                        const startX = nodeD === nodeL
                            ? rectL.left + rectL.width + FAMILY_TREE_MATE_SLOT_OFFSET / 2
                            : rectR.left - FAMILY_TREE_MATE_SLOT_OFFSET / 2;
                        for (const childId of childrenId) {
                            const nodeC = layout.nodeFromId(childId)!;
                            const rectC = getNodeRect(nodeC);
                            plotElbowHorizontal(drawing,
                                startX, rectD.top + rectD.height / 2,
                                getSlotY(nodeD, childrenSlot),
                                rectC.left + rectC.width / 2, rectC.top
                            ).addClass(classNames(scss.familyTreeConnection, scss.familyTreeConnectionChild));
                        }
                    }
                }
            } else {
                // ISingleParentLayoutConnection
                const { id1, childrenSlot, childrenId } = connection;
                const node1 = layout.nodeFromId(id1);
                console.assert(node1, "Single parent node missing", id1);
                if (!node1) continue;
                const rect1 = getNodeRect(node1);
                if (childrenId && childrenSlot) {
                    for (const childId of childrenId) {
                        const nodeC = layout.nodeFromId(childId)!;
                        const rectC = getNodeRect(nodeC);
                        plotElbowHorizontal(drawing,
                            rect1.left + rect1.width / 2, rect1.top + rect1.height,
                            getSlotY(node1, childrenSlot),
                            rectC.left + rectC.width / 2, rectC.top
                        ).addClass(classNames(scss.familyTreeConnection, scss.familyTreeConnectionChild));
                    }
                }
            }
        }
        this.forceUpdate();
    }
    private _onDrawingRootChanged = (root: HTMLDivElement | null): void => {
        this._drawingRoot = root;
        this._updateDrawing();
    }
    public scrollToNode(id: string): boolean {
        const internalId = this._nodeInternalIdMap.get(id);
        if (internalId == null) return false;
        const rect = this._nodeRects.get(id);
        if (!rect) return false;
        const overlayRoot = this._overlayDomRoot.current;
        if (!overlayRoot) return false;
        let scrollContainer: HTMLElement | null = overlayRoot;
        while (scrollContainer && !scrollContainer.dataset.isScrollable) {
            scrollContainer = scrollContainer.parentElement;
        }
        if (!scrollContainer) return false;
        // We need to calculate the coordinates. Using scrollIntoView is not stable during CSS transition.
        scrollContainer.scrollTo({
            left: rect.left + rect.width / 2 - scrollContainer.clientWidth / 2,
            top: rect.top + rect.height / 2 - scrollContainer.clientHeight / 2,
            behavior: "smooth"
        });
        return true;
    }
    public render(): React.ReactNode {
        return (<div className={classNames(scss.familyTreeDrawing, this.props.className)}>
            <div className={scss.overlay} ref={this._overlayDomRoot}>{this._nodeContainers}</div>
            <div className={scss.drawing} ref={this._onDrawingRootChanged}></div>
        </div>);
    }
    public componentDidUpdate(prevProps: IFamilyTreeProps) {
        if (this._pendingOnRenderedCall && this.props.onRendered) {
            this.props.onRendered(this);
            this._pendingOnRenderedCall = false;
        }
        if (prevProps.familyTree !== this.props.familyTree) {
            this._updateDrawing();
        } else if (prevProps.onEvalNodeDimension !== this.props.onEvalNodeDimension) {
            // TODO we might need to determine whether the dimension has really changed.
            this._updateDrawing();
        }
    }
}

function plotElbowHorizontal(container: Svg.Container, x1: number, y1: number, y2: number, x3: number, y3: number): Svg.PolyLine {
    return container
        .polyline([x1, y1, x1, y2, x3, y2, x3, y3]);
}

// function plotElbowVertical(container: Svg.Container, x1: number, y1: number, x2: number, x3: number, y3: number): Svg.PolyLine {
//     return container
//         .polyline([x1, y1, x2, y1, x2, y3, x3, y3]);
// }

export function dumpFamilyTreeData(data: IFamilyTreeData): string {
    function getLabelFor(qName: RdfQName): string {
        return (dataService.getLabelFor(qName) || {}).label || qName;
    }
    const result: IFamilyTreeData = {
        roots: data.roots.map(v => getLabelFor(v)),
        mates: data.mates.map(([v1, v2]) => [getLabelFor(v1), getLabelFor(v2)]),
        children: data.children.map(([p1, p2, c]) => [getLabelFor(p1), p2 && getLabelFor(p2), getLabelFor(c)])
    };
    return JSON.stringify(result);
}
