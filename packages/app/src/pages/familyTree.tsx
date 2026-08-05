import { Grid, Slider, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { useSearchParams } from "react-router-dom";
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
import CommonScss from "./common.module.scss";
import { FamilyTreeRoutingParams, routePathBuilders } from "./routes";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IFamilyTreeProps {
}

export const FamilyTree: React.FC<IFamilyTreeProps> = React.memo(() => {
    const params = useParams<FamilyTreeRoutingParams>();
    const [search] = useSearchParams();
    const queryParams = parseQueryParams(search);
    const navigate = useNavigate();
    const characterId = params.character;
    const depth = queryParams.depth ?? 3;
    const [walkMode, setWalkMode] = React.useState<CharacterFamilyTreeWalkMode>("naive");
    const setPageTitle = useSetPageTitle();
    // Re-render the component when language changes.
    useLanguage();
    React.useEffect(() => {
        if (!characterId) {
            setPageTitle(resourceManager.getPrompt("FamilyTreeTitle"));
        } else {
            const label = dataService.getLabelFor(characterId);
            setPageTitle(resourceManager.getPrompt("FamilyTreeTitle1", [label?.label || characterId]));
        }
    }, [params]);
    if (!characterId) {
        return (<React.Fragment>
            <h1>{resourceManager.getPrompt("FamilyTreeTitle")}</h1>
            <p>{resourceManager.getPrompt("PageNeedsEntityId")}</p>
        </React.Fragment>);
    }
    if (!characterId.includes(":")) {
        location.replace(routePathBuilders.familyTree({ ...params, character: "wd:" + characterId }, search));
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
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                        <Typography id="max-depth-slider">Max depth: {depth}</Typography>
                        <Slider aria-labelledby="discrete-slider" marks value={depth} step={1} min={1} max={environment.isProduction ? 10 : 30} onChange={(_, v) => {
                            void navigate(routePathBuilders.familyTree(params, setQueryParams(search, { depth: v })));
                        }} />
                    </Grid>
                    {environment.isProduction ||
                        (<Grid size={{ xs: 12, md: 6, lg: 4 }}>
                            <Typography id="mode-selector">Mode</Typography>
                            <ToggleButtonGroup
                                aria-labelledby="mode-selector" size="small"
                                exclusive value={walkMode} onChange={(_: React.MouseEvent, v: string | null) => { if(v) setWalkMode(v as CharacterFamilyTreeWalkMode); }}>
                                <ToggleButton value="naive">Naïve</ToggleButton>
                                <ToggleButton value="bloodline">Bloodline</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>)}
                </Grid>
            </React.Fragment>
            )
        }
        <CharacterFamilyTree centerQName={characterId} walkMode={walkMode} maxDistance={depth}
            onNodeClick={(qName) => { location.href = routePathBuilders.familyTree({ character: qName }, search); }}
            emptyPlaceholder={<>
                <h3>{resourceManager.getPrompt("NoFamilyTreeInformation")}</h3>
                <p>{resourceManager.renderPrompt("HoweverCheckout1", [
                    <RdfEntityLink key={0} qName={characterId}>{resourceManager.getPrompt("EntityProfileTitle")}</RdfEntityLink>
                ])}</p>
            </>}
        />
    </div>);
});
FamilyTree.displayName = "FamilyTree";
