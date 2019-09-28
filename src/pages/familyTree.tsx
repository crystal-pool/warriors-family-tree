import { Grid, Paper, Slider, Typography } from "@material-ui/core";
import * as React from "react";
import { match } from "react-router";
import { CharacterFamilyTree } from "../components/familyTree/CharacterFamilyTree";
import { RdfEntityDescription, RdfEntityLabel } from "../components/RdfEntity";
import { dataService } from "../services";
import "./familyTree.scss";
import { IFamilyTreeRoutingParams, routePathBuilders } from "./routes";

export interface IFamilyTreeProps {
    match: match<IFamilyTreeRoutingParams>;
}

export const FamilyTree: React.FC<IFamilyTreeProps> = React.memo((props) => {
    let characterId = props.match.params.character;
    const [maxDistance, setMaxDistance] = React.useState(3);
    if (!characterId) {
        document.title = "Family tree";
        return (<React.Fragment>
            <h1>Family tree</h1>
            <p>Specify a character ID to continue.</p>
        </React.Fragment>);
    }
    if (characterId.indexOf(":") < 0) {
        location.replace(routePathBuilders.familyTree({ ...props.match, character: "wd:" + characterId }));
    }
    const label = dataService.getLabelFor(characterId);
    document.title = "Family tree - " + (label && label.label || characterId);
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
            <CharacterFamilyTree centerQName={characterId} mode="naive" maxDistance={maxDistance} />
        </Paper>
    </React.Fragment>);
});
