import { Grid, Paper, Typography } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { EntityRoutingParams, routePathBuilders } from "..";
import { EmbedAppBar } from "../../components/EmbedAppBar";
import { CharacterActionLinks } from "../../components/entities/actionLinks";
import { CharacterBadges } from "../../components/entities/CharacterBadges";
import { EntityExternalLinks } from "../../components/entities/EntityExternalLinks";
import { RdfEntityDescription, RdfEntityLabel } from "../../components/RdfEntity";
import { resourceManager } from "../../localization";
import { useLanguage } from "../../localization/react";
import { dataService } from "../../services";
import { buildUiScopeProps } from "../../utility/featureUsage";
import { parseQueryParams } from "../../utility/queryParams";
import { useSetPageTitle } from "../../utility/react";
import CommonScss from "../common.scss";
import { CharacterEntityDetails } from "./character";
import Scss from "./entityPage.scss";

export interface IEntityProfileProps {
}

interface IEntityPartials {
    badges?: React.ReactNode;
    titleLinks?: React.ReactNode;
    detail: React.ReactNode;
}

function renderEntityPartials(qName: string): IEntityPartials {
    if (dataService.getCharacterProfileFor(qName)) {
        return {
            badges: <CharacterBadges qName={qName} />,
            titleLinks: <CharacterActionLinks qName={qName} />,
            detail: <CharacterEntityDetails qName={qName} />
        };
    }
    return {
        detail: (<p>{resourceManager.getPrompt("EntityNotFound1", [qName])}</p>)
    };
}

export const EntityProfile: React.FC<IEntityProfileProps> = React.memo((props) => {
    const params = useParams<EntityRoutingParams>();
    const [search] = useSearchParams();
    const queryParams = parseQueryParams(search);
    const entityQName = params.qName;
    const setPageTitle = useSetPageTitle();
    // Re-render the component when language changes.
    useLanguage();
    React.useEffect(() => {
        if (!entityQName) {
            setPageTitle(resourceManager.getPrompt("EntityProfileTitle"));
        } else {
            const label = dataService.getLabelFor(entityQName);
            setPageTitle(label && label.label || entityQName);
        }
    }, [params]);
    if (!entityQName) {
        return (<React.Fragment>
            <h1>{resourceManager.getPrompt("EntityProfileTitle")}</h1>
            <p>{resourceManager.getPrompt("PageNeedsEntityId")}</p>
        </React.Fragment>);
    }
    if (entityQName.indexOf(":") < 0) {
        location.replace(routePathBuilders.familyTree({ ...params, character: "wd:" + entityQName }, search));
    }
    const partials = renderEntityPartials(entityQName);
    return (<div {...buildUiScopeProps("entityPage")}>
        {queryParams.embed
            ? (<React.Fragment>
                <EmbedAppBar title={<span>
                    <RdfEntityLabel qName={entityQName} variant="plain-with-id-link" />
                    <span className={Scss.titleBadges}>{partials.badges}</span>
                </span>} />
                <Grid container {...buildUiScopeProps("siteLinks")}>
                    <Grid item sm={12} md={5}>
                        <div className={CommonScss.titleLinks}>{partials.titleLinks}</div>
                        <Typography variant="subtitle2"><RdfEntityDescription qName={entityQName} /></Typography>
                    </Grid>
                    <Grid item sm={12} md={7} className={Scss.expandablePanelAnchor}>
                        <Paper className={classNames(Scss.expandablePanelContainer, Scss.compact)}>
                            <h4>{resourceManager.getPrompt("SiteLinksTitle")}</h4>
                            <EntityExternalLinks qName={entityQName} />
                        </Paper>
                    </Grid>
                </Grid>
            </React.Fragment>)
            : (<Grid container spacing={4}>
                <Grid item sm={12} md={5} {...buildUiScopeProps("title")}>
                    <h1>
                        <RdfEntityLabel qName={entityQName} variant="plain-with-id-link" />
                        <span className={Scss.titleBadges}>{partials.badges}</span>
                    </h1>
                    <div className={CommonScss.titleLinks}>{partials.titleLinks}</div>
                    <Typography variant="subtitle1"><RdfEntityDescription qName={entityQName} /></Typography>
                </Grid>
                <Grid item sm={12} md={7} className={Scss.expandablePanelAnchor} {...buildUiScopeProps("siteLinks")}>
                    <Paper className={Scss.expandablePanelContainer}>
                        <h2>{resourceManager.getPrompt("SiteLinksTitle")}</h2>
                        <EntityExternalLinks qName={entityQName} />
                    </Paper>
                </Grid>
            </Grid>)
        }
        {partials.detail}
    </div>);
});
EntityProfile.displayName = "Entity";
