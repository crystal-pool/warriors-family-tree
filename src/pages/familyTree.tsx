import { Slider, Typography } from "@material-ui/core";
import * as React from "react";
import { match } from "react-router";
import { FamilyTree as FamilyTreeComponent, IFamilyTreeNode } from "../components/FamilyTree";
import { RdfEntityDescription, RdfEntityLabel } from "../components/RdfEntity";
import { dataService } from "../services";
import { CharacterRelationType, RdfQName } from "../services/dataService";

export interface IFamilyTreeRoutingParams {
    character?: string;
}

export interface IFamilyTreeProps {
    match: match<IFamilyTreeRoutingParams>;
}

function renderNode(this: IFamilyTreeNode): React.ReactNode {
    return <RdfEntityLabel qName={this.id} />;
}

function walk(characterId: RdfQName, maxDistanceUp?: number, maxDistanceDown?: number): IFamilyTreeNode[] {
    if (maxDistanceUp && maxDistanceUp < 0)
        throw new RangeError("maxDistanceUp should be non-negative number.");
    if (maxDistanceDown && maxDistanceDown < 0)
        throw new RangeError("maxDistanceDown should be non-negative number.");
    const q: [number, RdfQName][] = [[0, characterId]];
    const edgeTypes = new Set<CharacterRelationType>(["parent", "child"]);
    const nodeMap = new Map<RdfQName, IFamilyTreeNode>();
    while (q.length > 0) {
        // distance > 0: Down
        // distance < 0: Up
        const [distance, charId] = q.shift()!;
        if (nodeMap.has(charId)) continue;
        const node: IFamilyTreeNode = { id: charId, render: renderNode };
        nodeMap.set(charId, node);
        const relations = dataService.getRelationsFor(charId, edgeTypes);
        if (!relations) continue;
        for (const relation of relations) {
            if (relation.relation === "parent" && (maxDistanceUp == null || distance - 1 >= -maxDistanceUp) && !nodeMap.has(relation.target)) {
                if (node.parentId1 == null) node.parentId1 = relation.target;
                else if (node.parentId2 == null) node.parentId2 = relation.target;
                else console.warn(`${charId} has more than 2 parents.`);
                q.push([distance - 1, relation.target]);
            } else if (relation.relation === "child" && (maxDistanceDown == null || distance + 1 <= maxDistanceDown) && !nodeMap.has(relation.target)) {
                q.push([distance + 1, relation.target]);
            }
        }
    }
    return Array.from(nodeMap.values());
}

export const FamilyTree: React.FC<IFamilyTreeProps> = (props) => {
    let characterId = props.match.params.character;
    const [depth, setDepth] = React.useState(3);
    const [familyTreeNodes, setFamilyTreeNodes] = React.useState<IFamilyTreeNode[]>([]);
    React.useEffect(() => {
        if (!characterId) return;
        const nodes = walk(characterId, depth, depth);
        setFamilyTreeNodes(nodes);
    }, [characterId, depth]);
    if (!characterId) {
        return <span>No character ID specified.</span>;
    }
    if (characterId.indexOf(":") < 0) characterId = "wd:" + characterId;
    return (<React.Fragment>
        <h1>Family tree of <RdfEntityLabel qName={characterId} showEntityId={true} /></h1>
        <Typography variant="subtitle1"><RdfEntityDescription qName={characterId} /></Typography>
        <Typography id="max-depth-slider" gutterBottom>Max depth: {depth}</Typography>
        <Slider aria-labelledby="discrete-slider" valueLabelDisplay="auto" marks value={depth} step={1} min={1} max={6} onChange={(e, v) => setDepth(v as number)} />
        <FamilyTreeComponent nodes={familyTreeNodes} />
    </React.Fragment>);
};
