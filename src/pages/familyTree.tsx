import { Grid, Slider, Typography } from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import * as React from "react";
import { RouteComponentProps } from "react-router";
import { EmbedAppBar } from "../components/EmbedAppBar";
import { CharacterActionLinks } from "../components/entities/actionLinks";
import { CharacterFamilyTree, CharacterFamilyTreeWalkMode } from "../components/familyTree/CharacterFamilyTree";
import { RdfEntityDescription, RdfEntityLabel, RdfEntityLink } from "../components/RdfEntity";
import { resourceManager } from "../localization";
import { useLanguage } from "../localization/react";
import { dataService } from "../services";
import { buildUiScopeProps } from "../utility/featureUsage";
import { parseQueryParams, setQueryParams } from "../utility/queryParams";
import { useSetPageTitle } from "../utility/react";
import CommonScss from "./common.scss";
import { IFamilyTreeRoutingParams, routePathBuilders } from "./routes";

export interface IFamilyTreeProps extends RouteComponentProps<IFamilyTreeRoutingParams> {
}

export const FamilyTree: React.FC<IFamilyTreeProps> = React.memo((props) => {
    const characterId = props.match.params.character;
    const queryParams = parseQueryParams(props.location.search);
    const depth = queryParams.depth || 3;
    const [walkMode, setWalkMode] = React.useState<CharacterFamilyTreeWalkMode>("naive");
    const setPageTitle = useSetPageTitle();
    // Re-render the component when language changes.
    useLanguage();
    React.useEffect(() => {
        if (!characterId) {
            setPageTitle(resourceManager.getPrompt("FamilyTreeTitle"));
        } else {
            const label = dataService.getLabelFor(characterId);
            setPageTitle(resourceManager.getPrompt("FamilyTreeTitle1", [label && label.label || characterId]));
        }
    }, [props.match]);
    if (!characterId) {
        return (<React.Fragment>
            <h1>{resourceManager.getPrompt("FamilyTreeTitle")}</h1>
            <p>{resourceManager.getPrompt("PageNeedsEntityId")}</p>
        </React.Fragment>);
    }
    if (characterId.indexOf(":") < 0) {
        location.replace(routePathBuilders.familyTree({ ...props.match.params, character: "wd:" + characterId }, props.location.search));
    }
    return (<div {...buildUiScopeProps("familyTreePage")}>
        {queryParams.embed
            ? (<React.Fragment>
                <EmbedAppBar title={resourceManager.renderPrompt("FamilyTreeTitle1", [<RdfEntityLabel key="0" qName={characterId} />])} />
                <CharacterActionLinks className={CommonScss.titleLinks} qName={characterId} />
                <Typography variant="subtitle2"><RdfEntityDescription qName={characterId} /></Typography>
            </React.Fragment>)
            : (<React.Fragment>
                <h1>{resourceManager.renderPrompt("FamilyTreeTitle1", [<RdfEntityLabel key="0" qName={characterId} />])}</h1>
                <CharacterActionLinks className={CommonScss.titleLinks} qName={characterId} />
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
        <CharacterFamilyTree centerQName={characterId} walkMode={walkMode} maxDistance={depth}
            onNodeClick={(qName) => { location.href = routePathBuilders.familyTree({ character: qName }, props.location.search); }}
            emptyPlaceholder={<>
                <h3>{resourceManager.getPrompt("NoFamilyTreeInformation")}</h3>
                <p>{resourceManager.renderPrompt("HoweverCheckout1", [
                    <RdfEntityLink key={0} qName={characterId}>{resourceManager.getPrompt("EntityProfileTitle")}</RdfEntityLink>
                ])}</p>
            </>}
        />
    </div>);
}, function propsComparer(prevProps, nextProps) {
    return prevProps.location === nextProps.location;
});
FamilyTree.displayName = "FamilyTree";
