import { Grid, Paper, Slider, Typography } from "@material-ui/core";
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

function walk(characterId: RdfQName, maxDistance?: number): IFamilyTreeNode[] {
    if (maxDistance && maxDistance < 0)
        throw new RangeError("maxDistanceUp should be non-negative number.");
    const q: [number, RdfQName, RdfQName?][] = [[0, characterId]];
    const edgeTypes = new Set<CharacterRelationType>(["parent", "child"]);
    const nodeMap = new Map<RdfQName, IFamilyTreeNode>();
    while (q.length > 0) {
        const [distance, charId, reachedFrom] = q.shift()!;
        if (nodeMap.has(charId)) continue;
        const node: IFamilyTreeNode & { distance?: number, reachedFrom?: string } = {
            id: charId,
            render: renderNode,
            // distance,
            // reachedFrom
        };
        nodeMap.set(charId, node);
        const relations = dataService.getRelationsFor(charId, edgeTypes);
        if (!relations) continue;
        for (const relation of relations) {
            if (maxDistance != null && distance + 1 > maxDistance) continue;
            if (relation.relation === "parent") {
                if (node.parentId1 == null) node.parentId1 = relation.target;
                else if (node.parentId2 == null) node.parentId2 = relation.target;
                else console.warn(`${charId} has more than 2 parents.`);
            }
            if (!nodeMap.has(relation.target)) {
                q.push([distance + 1, relation.target, charId]);
            }
        }
    }
    return Array.from(nodeMap.values());
}

export const FamilyTree: React.FC<IFamilyTreeProps> = (props) => {
    let characterId = props.match.params.character;
    const [maxDistance, setMaxDistance] = React.useState(3);
    const [familyTreeNodes, setFamilyTreeNodes] = React.useState<IFamilyTreeNode[]>([]);
    React.useEffect(() => {
        if (!characterId) return;
        const nodes = walk(characterId, maxDistance);
        setFamilyTreeNodes(nodes);
    }, [characterId, maxDistance]);
    if (!characterId) {
        return <span>No character ID specified.</span>;
    }
    if (characterId.indexOf(":") < 0) characterId = "wd:" + characterId;
    return (<React.Fragment>
        <h1>Family tree of <RdfEntityLabel qName={characterId} showEntityId={true} /></h1>
        <Typography variant="subtitle1"><RdfEntityDescription qName={characterId} /></Typography>
        <Grid container spacing={1}>
            <Grid item xs={12} md={6} lg={4}>
                <Typography id="max-depth-slider">Max depth: {maxDistance}</Typography>
                <Slider aria-labelledby="discrete-slider" marks value={maxDistance} step={1} min={1} max={30} onChange={(e, v) => setMaxDistance(v as number)} />
            </Grid>
        </Grid>
        <Paper>
            <FamilyTreeComponent nodes={familyTreeNodes} />
        </Paper>
    </React.Fragment>);
};
