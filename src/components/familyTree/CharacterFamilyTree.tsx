import { Theme, Tooltip, withStyles } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import wu from "wu";
import { routePathBuilders } from "../../pages";
import { dataService } from "../../services";
import { CharacterRelationType, RdfQName } from "../../services/dataService";
import { buildUnorderedIdPair, parseUnorderedIdPair } from "../../utility/general";
import { CharacterCard } from "../CharacterCard";
import "./CharacterFamilyTree.scss";
import { FamilyTree, IFamilyTreeData, NodeRenderCallback } from "./FamilyTree";

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
    if (!props.centerQName) {
        return null;
    }
    const renderNode: NodeRenderCallback = (id, brct) => {
        return (<FamilyTreeNode qName={id} isCurrent={id === props.centerQName} />);
    };
    return familyTreeData
        && <FamilyTree className="character-family-tree" familyTree={familyTreeData}
            nodeWidth={120} nodeHeight={50}
            onRenderNode={renderNode} debugInfo={props.debugInfo} />
        || null;
});

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
    const [label, setLabel] = React.useState(() => dataService.getLabelFor(props.qName));
    React.useEffect(() => {
        const subscription = dataService.onLanguageChanged(() => {
            setLabel(dataService.getLabelFor(props.qName));
        });
        return () => subscription.dispose();
    });
    return (<HoverTooltip style={{ fontSize: "unset" }} title={<CharacterCard qName={props.qName} />} interactive>
        <div className={classNames("familytree-node", props.isCurrent && "current")} onClick={() => {
            location.href = routePathBuilders.familyTree({ character: props.qName });
        }}>
            {label && <div className="entity-name">{label.label}</div>}
            <div className="entity-id">{props.qName}</div>
        </div>
    </HoverTooltip>);
};
