import { Link, Tooltip } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { resourceManager } from "../localization";
import { routePathBuilders } from "../pages";
import { dataService } from "../services";
import { tryGetFullUri } from "../services/dataConfig";
import { RdfQName, useLabelFor } from "../services/dataService";
import { resetQueryParams } from "../utility/queryParams";
import Scss from "./RdfEntity.scss";

export interface IRdfEntityLinkProps {
    qName: RdfQName;
    title?: React.ReactNode;
}

export const RdfEntityLink: React.FC<IRdfEntityLinkProps> = (props) => {
    const uri = props.qName && tryGetFullUri(props.qName);
    let title = props.title;
    if (title === undefined && uri) {
        title = resourceManager.getPrompt("GoToEntityDataSource");
        if (props.qName.startsWith("wd:")) {
            title += resourceManager.getPrompt("Brackets", ["Crystal Pool"]);
        }
    }
    return (<Tooltip title={title}>
        {uri
            ? <Link className="entity-id entity-uri-link" href={uri} target="_blank">{props.qName}</Link>
            : <span className="entity-id entity-not-expandable">{props.qName}</span>}
    </Tooltip>);
};
RdfEntityLink.displayName = "RdfEntityLink";

export interface IRdfEntityLabelProps {
    qName: RdfQName;
    fallbackLabel?: React.ReactNode;
    variant?: "plain" | "link" | "plain-with-id-link" | "link-with-id-link";
}

export const RdfEntityLabel: React.FC<IRdfEntityLabelProps> = (props) => {
    const { qName, variant = "plain" } = props;
    const label = useLabelFor(dataService, qName)?.label;
    const loc = useLocation();
    function renderLabel() {
        const className = classNames(!label && Scss.entityLabelFallback);
        // Use qName as fallback label if label is missing and we need to show label only.
        const isIdVisible = variant === "plain-with-id-link" || variant === "link-with-id-link";
        const displayLabel = label ?? props.fallbackLabel ?? (isIdVisible ? undefined : qName);
        if (variant === "link" || variant === "link-with-id-link")
            return (<Link className={className} href={routePathBuilders.entityProfile({ qName }, resetQueryParams(loc.search))}>{displayLabel}</Link>);
        else
            return (<span className={className}>{displayLabel}</span>);
    }
    return (<span className={Scss.entityLabelContainer}>
        {renderLabel()}
        {variant === "plain-with-id-link" && (<span className={Scss.entityId}>{resourceManager.renderPrompt("Brackets", [<RdfEntityLink key={0} qName={props.qName} />])}</span>)}
    </span>);
};
RdfEntityLabel.displayName = "RdfEntityLabel";
RdfEntityLabel.defaultProps = { variant: "plain" };

export interface IRdfEntityDescriptionProps {
    qName: RdfQName;
    fallbackContent?: React.ReactNode;
}

export const RdfEntityDescription: React.FC<IRdfEntityDescriptionProps> = (props) => {
    const label = useLabelFor(dataService, props.qName);
    return <span>{label && label.description || props.fallbackContent}</span>;
};
RdfEntityDescription.displayName = "RdfEntityDescription";
