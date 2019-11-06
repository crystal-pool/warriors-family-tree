import { Theme, Tooltip, withStyles } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import { useLocation } from "react-router";
import wu from "wu";
import { routePathBuilders } from "../../pages";
import { dataService } from "../../services";
import { CharacterRelationType, RdfQName, useDataServiceLanguage, useLabelFor } from "../../services/dataService";
import { isRegExUnicodeCategorySupported } from "../../utility/compatibility";
import { buildUnorderedIdPair, parseUnorderedIdPair } from "../../utility/general";
import { CharacterCard } from "../CharacterCard";
import scss from "./CharacterFamilyTree.scss";
import { FamilyTree, IFamilyTreeData, NodeRenderCallback } from "./FamilyTree";
import { ISize } from "./layout";

export type CharacterFamilyTreeWalkMode = "naive" | "bloodline";

export interface ICharacterFamilyTreeProps {
    centerQName: string;
    walkMode?: CharacterFamilyTreeWalkMode;
    maxDistance: number;
    debugInfo?: boolean;
}

export interface IFamilyTreeNodeProps {
    qName: string;
    isCurrent: boolean;
}

function walk(characterId: RdfQName, walkMode?: CharacterFamilyTreeWalkMode, maxDistance?: number): IFamilyTreeData {
    if (maxDistance && maxDistance < 0)
        throw new RangeError("maxDistanceUp should be non-negative number.");
    const edgeTypes = new Set<CharacterRelationType>(["parent", "child", "mate"]);
    const q: [number, RdfQName, number, RdfQName?][] = [[0, characterId, maxDistance == null ? -1 : maxDistance]];
    const visited = new Set<RdfQName>();
    const mates = new Set<string>();
    const children: [RdfQName, RdfQName | undefined, RdfQName][] = [];
    const roots: RdfQName[] = [];
    while (q.length) {
        const [distance, charId, tokensLeft, /*reachedFrom*/] = q.shift()!;
        if (visited.has(charId)) continue;
        visited.add(charId);
        if (tokensLeft === 0) continue;
        const relations = dataService.getRelationsFor(charId, edgeTypes);
        let parentId1: RdfQName | undefined;
        let parentId2: RdfQName | undefined;
        if (!relations || tokensLeft === 0) continue;
        for (const relation of relations) {
            if (relation.relation === "parent") {
                if (parentId1 == null) parentId1 = relation.target;
                else if (parentId2 == null) parentId2 = relation.target;
                else console.warn(`${charId} has more than 2 parents.`);
            } else if (relation.relation === "mate") {
                mates.add(buildUnorderedIdPair(charId, relation.target));
            }
            if (!visited.has(relation.target)) {
                const tokens0 = Math.max(tokensLeft - 1, -1);
                let tokens1 = tokens0;
                if (walkMode === "bloodline") {
                    if (relation.relation === "mate") {
                        tokens1 = 1;
                    }
                }
                q.push([distance + 1, relation.target, tokens0 < 0 ? tokens1 : Math.min(tokens0, tokens1), charId]);
            }
        }
        if (parentId1 == null && parentId2 == null) {
            roots.push(charId);
        } else {
            children.push([parentId1!, parentId2, charId]);
        }
    }
    return {
        roots,
        children,
        mates: wu.map(m => parseUnorderedIdPair(m) as [string, string], mates).toArray()
    };
}

export const CharacterFamilyTree: React.FC<ICharacterFamilyTreeProps> = React.memo((props) => {
    const [familyTreeData, setFamilyTreeData] = React.useState<IFamilyTreeData | undefined>();
    React.useEffect(() => {
        if (!props.centerQName) return;
        const familyTree = walk(props.centerQName, props.walkMode, props.maxDistance);
        setFamilyTreeData(familyTree);
    }, [props.centerQName, props.walkMode, props.maxDistance]);
    const onFamilyTreeRendered = React.useCallback((ft: FamilyTree) => {
        ft.scrollToNode(props.centerQName);
    }, [props.centerQName]);
    const evaluateNodeDimension = React.useCallback(function evaluateNodeDimension(id: string): ISize {
        const label = dataService.getLabelFor(id)?.label || id;
        const CHARACTER_WIDTH = 9;
        // RegEx syntax error in /.../ block will be treated as script syntax error.
        const wideCharacterMatcher = isRegExUnicodeCategorySupported ? new RegExp("\\p{Lo}", "ug") : /[\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5-\u1CF6\u1CFA\u2135-\u2138\u3006\u303C\u00AA\u00BA\u01BB\u01C0-\u01C3\u0294\uA78F\uA7F7\uA7FB-\uA7FF\uA66E\u05D0-\u05EA\u05EF-\u05F2\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFB4F\u0620-\u063F\u0641-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0750-\u077F\u08A0-\u08B4\u08B6-\u08BD\uFB50-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC]/ug;
        const effectiveLength = label.length + (label.match(wideCharacterMatcher)?.length || 0);
        const subTitleWidth = id.length * CHARACTER_WIDTH + CHARACTER_WIDTH;
        if (effectiveLength <= 26) {
            return { width: Math.max(100, subTitleWidth, Math.ceil((effectiveLength * CHARACTER_WIDTH + CHARACTER_WIDTH) / 20) * 20), height: 50 };
        } else {
            return { width: 200, height: 30 + Math.ceil(effectiveLength / 24) * 20 };
        }
    }, [useDataServiceLanguage(dataService)]);
    if (!props.centerQName) {
        return null;
    }
    const renderNode: NodeRenderCallback = React.useCallback((id, brct) => {
        return (<FamilyTreeNode qName={id} isCurrent={id === props.centerQName} />);
    }, [props.centerQName]);
    return familyTreeData
        && <FamilyTree
            className={scss.characterFamilyTree} familyTree={familyTreeData}
            onRenderNode={renderNode} onRendered={onFamilyTreeRendered}
            onEvalNodeDimension={evaluateNodeDimension}
            debugInfo={props.debugInfo} />
        || null;
});
CharacterFamilyTree.displayName = "CharacterFamilyTree";

const HoverTooltip = withStyles((theme: Theme) => ({
    tooltip: {
        padding: "0",
        backgroundColor: "unset",
        boxShadow: theme.shadows[1],
        fontSize: "unset",
        fontWeight: "unset"
    },
}))(Tooltip);

export const FamilyTreeNode: React.FC<IFamilyTreeNodeProps> = (props) => {
    const label = useLabelFor(dataService, props.qName);
    const profile = dataService.getCharacterProfileFor(props.qName);
    const loc = useLocation();
    return (<HoverTooltip
        style={{ fontSize: "unset" }}
        title={<CharacterCard qName={props.qName} />}
        enterDelay={300} leaveDelay={300}
        interactive>
        <div className={classNames(scss.familytreeNode, props.isCurrent && scss.current, profile?.gender && scss[profile?.gender])} onClick={() => {
            location.href = routePathBuilders.familyTree({ character: props.qName }, loc.search);
        }}>
            {label && <div className="entityLabel">{label.label}</div>}
            <div className={scss.entityId}>{props.qName}</div>
        </div>
    </HoverTooltip>);
};
FamilyTreeNode.displayName = "FamilyTreeNode";
