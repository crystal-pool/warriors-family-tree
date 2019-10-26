import { Grid, Paper, Slider, Typography } from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { CharacterFamilyTree, CharacterFamilyTreeWalkMode } from "../components/familyTree/CharacterFamilyTree";
import { RdfEntityDescription, RdfEntityLabel } from "../components/RdfEntity";
import { resourceManager } from "../localization";
import { dataService } from "../services";
import { setDocumentTitle } from "../utility/general";
import { parseQueryParams, setQueryParams } from "../utility/queryParams";
import { appInsights } from "../utility/telemetry";
import "./familyTree.scss";
import { IFamilyTreeRoutingParams, routePathBuilders } from "./routes";

export interface IFamilyTreeProps extends RouteComponentProps<IFamilyTreeRoutingParams> {
}

export const FamilyTree: React.FC<IFamilyTreeProps> = React.memo((props) => {
    const characterId = props.match.params.character;
    const queryParams = parseQueryParams(props.location.search);
    const depth = queryParams.depth || 3;
    const [walkMode, setWalkMode] = React.useState<CharacterFamilyTreeWalkMode>("naive");
    React.useEffect(() => {
        if (!characterId) {
            setDocumentTitle(resourceManager.getPrompt("FamilyTreeTitle"));
        } else {
            const label = dataService.getLabelFor(characterId);
            setDocumentTitle(resourceManager.getPrompt("FamilyTreeTitle1", [label && label.label || characterId]));
        }
        appInsights.trackPageView();
    }, [props.match]);
    if (!characterId) {
        return (<React.Fragment>
            <h1>resourceManager.getPrompt("FamilyTreeTitle")</h1>
            <p>Specify a character ID to continue.</p>
        </React.Fragment>);
    }
    if (characterId.indexOf(":") < 0) {
        location.replace(routePathBuilders.familyTree({ ...props.match.params, character: "wd:" + characterId }, props.location.search));
    }
    return (<React.Fragment>
        {queryParams.embed
            ? (<React.Fragment>
                <h3>{resourceManager.renderPrompt("FamilyTreeTitle1", [<RdfEntityLabel key="0" qName={characterId} />])}</h3>
                <Typography variant="subtitle2"><RdfEntityDescription qName={characterId} /></Typography>
            </React.Fragment>)
            : (<React.Fragment>
                <h1>{resourceManager.renderPrompt("FamilyTreeTitle1", [<RdfEntityLabel key="0" qName={characterId} />])}</h1>
                <Typography variant="subtitle1"><RdfEntityDescription qName={characterId} /></Typography>
                <Grid container spacing={1}>
                    <Grid item xs={12} md={6} lg={4}>
                        <Typography id="max-depth-slider">Max depth: {depth}</Typography>
                        <Slider aria-labelledby="discrete-slider" marks value={depth} step={1} min={1} max={environment.isProduction ? 10 : 30} onChange={(e, v) => {
                            location.replace(routePathBuilders.familyTree(props.match.params, setQueryParams(props.location.search, { depth: v as number })));
                        }} />
                    </Grid>
                    {environment.isProduction ||
                        (<Grid item xs={12} md={6} lg={4}>
                            <Typography id="mode-selector">Mode</Typography>
                            <ToggleButtonGroup
                                aria-labelledby="mode-selector" size="small"
                                exclusive value={walkMode} onChange={(_, v) => { v && setWalkMode(v); }}>
                                <ToggleButton value="naive">Naïve</ToggleButton>
                                <ToggleButton value="bloodline">Bloodline</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>)}
                </Grid>
            </React.Fragment>
            )
        }
        <Paper className="familytree-container">
            <CharacterFamilyTree centerQName={characterId} walkMode={walkMode} maxDistance={depth} />
        </Paper>
    </React.Fragment>);
});
