import { Typography } from "@material-ui/core";
import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import { routePathBuilders } from "..";
import { EmbedAppBar } from "../../components/EmbedAppBar";
import { RdfEntityDescription, RdfEntityLabel } from "../../components/RdfEntity";
import { resourceManager } from "../../localization";
import { useLanguage } from "../../localization/react";
import { dataService } from "../../services";
import { parseQueryParams } from "../../utility/queryParams";
import { useSetPageTitle } from "../../utility/react";
import { IEntityRoutingParams } from "../routes";
import { CharacterEntityDetails } from "./character";

export interface IEntityPageProps extends RouteComponentProps<IEntityRoutingParams> {
}

function renderEntityDetails(qName: string): React.ReactNode {
    if (dataService.getCharacterProfileFor(qName)) return <CharacterEntityDetails qName={qName} />;
    return <p>{resourceManager.getPrompt("EntityNotFound1", [qName])}</p>;
}

export const Entity: React.FC<IEntityPageProps> = React.memo((props) => {
    const entityQName = props.match.params.qName;
    const queryParams = parseQueryParams(props.location.search);
    const setPageTitle = useSetPageTitle();
    // Re-render the component when language changes.
    useLanguage();
    React.useEffect(() => {
        if (!entityQName) {
            setPageTitle(resourceManager.getPrompt("EntityPageTitle"));
        } else {
            const label = dataService.getLabelFor(entityQName);
            setPageTitle(label && label.label || entityQName);
        }
    }, [props.match]);
    if (!entityQName) {
        return (<React.Fragment>
            <h1>{resourceManager.getPrompt("EntityPageTitle")}</h1>
            <p>{resourceManager.getPrompt("PageNeedsEntityId")}</p>
        </React.Fragment>);
    }
    if (entityQName.indexOf(":") < 0) {
        location.replace(routePathBuilders.familyTree({ ...props.match.params, character: "wd:" + entityQName }, props.location.search));
    }
    return (<React.Fragment>
        {queryParams.embed
            ? (<React.Fragment>
                <EmbedAppBar title={<RdfEntityLabel qName={entityQName} showEntityId />} />
                <Typography variant="subtitle2"><RdfEntityDescription qName={entityQName} /></Typography>
            </React.Fragment>)
            : (<React.Fragment>
                <h1><RdfEntityLabel qName={entityQName} showEntityId /></h1>
                <Typography variant="subtitle1"><RdfEntityDescription qName={entityQName} /></Typography>
            </React.Fragment>
            )
        }
        {renderEntityDetails(entityQName)}
    </React.Fragment>);
}, function propsComparer(prevProps, nextProps) {
    return prevProps.location === nextProps.location;
});
Entity.displayName = "Entity";
