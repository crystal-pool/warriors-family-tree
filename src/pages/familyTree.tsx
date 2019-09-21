import { Grid, Paper, Slider, Typography } from "@material-ui/core";
import * as React from "react";
import { match } from "react-router";
import wu from "wu";
import { FamilyTree as FamilyTreeComponent, IFamilyTree, NodeRenderCallback } from "../components/FamilyTree";
import { RdfEntityDescription, RdfEntityLabel, RdfEntityLink } from "../components/RdfEntity";
import { dataService } from "../services";
import { CharacterRelationType, RdfQName } from "../services/dataService";
import { buildUnorderedIdPair, parseUnorderedIdPair } from "../utility/general";
import "./familyTree.scss";

export interface IFamilyTreeRoutingParams {
    character?: string;
}

export interface IFamilyTreeProps {
    match: match<IFamilyTreeRoutingParams>;
}

export interface IFamilyTreeNodeProps {
    qName: string;
}

const renderNode: NodeRenderCallback = (id, brct) => {
    return (<FamilyTreeNode qName={id} />);
};

function walk(characterId: RdfQName, maxDistance?: number): IFamilyTree {
    if (maxDistance && maxDistance < 0)
        throw new RangeError("maxDistanceUp should be non-negative number.");
    const edgeTypes = new Set<CharacterRelationType>(["parent", "child", "mate"]);
    const q: [number, RdfQName, RdfQName?][] = [[0, characterId]];
    const visited = new Set<RdfQName>();
    const mates = new Set<string>();
    const children: [RdfQName, RdfQName | undefined, RdfQName][] = [];
    const roots: RdfQName[] = [];
    while (q.length) {
        const [distance, charId, reachedFrom] = q.shift()!;
        if (visited.has(charId)) continue;
        visited.add(charId);
        const relations = dataService.getRelationsFor(charId, edgeTypes);
        let parentId1: RdfQName | undefined;
        let parentId2: RdfQName | undefined;
        if (!relations) continue;
        for (const relation of relations) {
            if (maxDistance != null && distance + 1 > maxDistance) continue;
            if (relation.relation === "parent") {
                if (parentId1 == null) parentId1 = relation.target;
                else if (parentId2 == null) parentId2 = relation.target;
                else console.warn(`${charId} has more than 2 parents.`);
            } else if (relation.relation === "mate") {
                mates.add(buildUnorderedIdPair(charId, relation.target));
            }
            if (!visited.has(relation.target)) {
                q.push([distance + 1, relation.target, charId]);
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

export const FamilyTree: React.FC<IFamilyTreeProps> = (props) => {
    let characterId = props.match.params.character;
    const [maxDistance, setMaxDistance] = React.useState(3);
    const [familyTreeData, setFamilyTreeData] = React.useState<IFamilyTree | undefined>();
    React.useEffect(() => {
        if (!characterId) return;
        const familyTree = walk(characterId, maxDistance);
        setFamilyTreeData(familyTree);
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
        <Paper className="familytree-container">
            {familyTreeData && <FamilyTreeComponent familyTree={familyTreeData} onRenderNode={renderNode} />}
        </Paper>
    </React.Fragment>);
};

export const FamilyTreeNode: React.FC<IFamilyTreeNodeProps> = (props) => {
    return (<div className="familytree-node">
        <RdfEntityLabel qName={props.qName} />
        <br />
        <RdfEntityLink qName={props.qName} />
    </div>);
};
