import { Typography } from "@material-ui/core";
import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import { routePathBuilders } from "..";
import { EmbedAppBar } from "../../components/EmbedAppBar";
import { CharacterActionLinks } from "../../components/entities/actionLinks";
import { CharacterBadges } from "../../components/entities/CharacterBadges";
import { RdfEntityDescription, RdfEntityLabel } from "../../components/RdfEntity";
import { resourceManager } from "../../localization";
import { useLanguage } from "../../localization/react";
import { dataService } from "../../services";
import { parseQueryParams } from "../../utility/queryParams";
import { useSetPageTitle } from "../../utility/react";
import CommonScss from "../common.scss";
import { IEntityRoutingParams } from "../routes";
import { CharacterEntityDetails } from "./character";
import Scss from "./entityPage.scss";

export interface IEntityProfileProps extends RouteComponentProps<IEntityRoutingParams> {
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
    const entityQName = props.match.params.qName;
    const queryParams = parseQueryParams(props.location.search);
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
    }, [props.match]);
    if (!entityQName) {
        return (<React.Fragment>
            <h1>{resourceManager.getPrompt("EntityProfileTitle")}</h1>
            <p>{resourceManager.getPrompt("PageNeedsEntityId")}</p>
        </React.Fragment>);
    }
    if (entityQName.indexOf(":") < 0) {
        location.replace(routePathBuilders.familyTree({ ...props.match.params, character: "wd:" + entityQName }, props.location.search));
    }
    const partials = renderEntityPartials(entityQName);
    return (<React.Fragment>
        {queryParams.embed
            ? (<React.Fragment>
                <EmbedAppBar title={<span>
                    <RdfEntityLabel qName={entityQName} variant="plain-with-id-link" />
                    <span className={Scss.titleBadges}>{partials.badges}</span>
                </span>} />
                <div className={CommonScss.titleLinks}>{partials.titleLinks}</div>
                <Typography variant="subtitle2"><RdfEntityDescription qName={entityQName} /></Typography>
            </React.Fragment>)
            : (<React.Fragment>
                <h1>
                    <RdfEntityLabel qName={entityQName} variant="plain-with-id-link" />
                    <span className={Scss.titleBadges}>{partials.badges}</span>
                </h1>
                <div className={CommonScss.titleLinks}>{partials.titleLinks}</div>
                <Typography variant="subtitle1"><RdfEntityDescription qName={entityQName} /></Typography>
            </React.Fragment>
            )
        }
        {partials.detail}
    </React.Fragment>);
}, function propsComparer(prevProps, nextProps) {
    return prevProps.location === nextProps.location;
});
EntityProfile.displayName = "Entity";
