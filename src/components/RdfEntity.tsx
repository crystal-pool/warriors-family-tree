import { Link, Tooltip } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { resourceManager } from "../localization";
import { routePathBuilders } from "../pages";
import { dataService } from "../services";
import { tryGetFullUri } from "../services/dataConfig";
import { RdfQName, useDataServiceLanguage, useLabelFor } from "../services/dataService";
import { buildFeatureAnchorProps } from "../utility/featureUsage";
import { resetQueryParams } from "../utility/queryParams";
import Scss from "./RdfEntity.scss";

function buildRdfNavigationFeatureAnchorProps(qName: RdfQName, external: boolean) {
    return buildFeatureAnchorProps(external ? "navigation.external.entity.uri" : "navigation.entity.profile", { qName });
}

export interface IRdfEntityLinkProps {
    qName: RdfQName;
    title?: React.ReactNode;
    external?: boolean;
}

export const RdfEntityLink: React.FC<IRdfEntityLinkProps> = (props) => {
    const { qName, external = false } = props;
    const href = props.qName && (external ? tryGetFullUri(qName) : routePathBuilders.entityProfile({ qName }, resetQueryParams(useLocation().search)));
    let title = props.title;
    if (title === undefined && href) {
        if (external) {
            title = resourceManager.getPrompt("GoToEntityDataSource");
            if (props.qName.startsWith("wd:")) {
                title += resourceManager.getPrompt("Brackets", ["Crystal Pool"]);
            }
        } else {
            title = resourceManager.getPrompt("EntityProfileTitle");
        }
    }
    return (<Tooltip title={title}>
        {href
            ? <Link className="entity-id entity-uri-link"
                href={href}
                target={external ? "_blank" : undefined}
                {...buildRdfNavigationFeatureAnchorProps(props.qName, external)}>{props.children || props.qName}</Link>
            : <span className="entity-id entity-not-expandable">{props.children || props.qName}</span>}
    </Tooltip>);
};
RdfEntityLink.displayName = "RdfEntityLink";

export interface IRdfEntityLabelProps {
    qName: RdfQName;
    fallbackLabel?: React.ReactNode;
    variant?: "plain" | "link" | "plain-with-id-link" | "link-with-id-link";
}

export const RdfEntityLabel: React.FC<IRdfEntityLabelProps> = React.forwardRef((props, ref: React.Ref<HTMLElement>) => {
    const { qName, variant = "plain" } = props;
    const language = useDataServiceLanguage(dataService);
    const label = useLabelFor(dataService, qName)?.label;
    function renderLabel() {
        const className = classNames(!label && Scss.entityLabelFallback);
        // Use qName as fallback label if label is missing and we need to show label only.
        const isIdVisible = variant === "plain-with-id-link" || variant === "link-with-id-link";
        const displayLabel = label ?? props.fallbackLabel ?? (isIdVisible ? undefined : qName);
        if (variant === "link" || variant === "link-with-id-link")
            // render internal link first
            return (<RdfEntityLink qName={qName}>{displayLabel}</RdfEntityLink>);
        else
            return (<span className={className}>{displayLabel}</span>);
    }
    const extraProps = { ...props };
    delete extraProps.qName;
    delete extraProps.fallbackLabel;
    delete extraProps.variant;
    return (<span ref={ref} className={Scss.entityLabelContainer} lang={language} {...extraProps}>
        {renderLabel()}
        {variant === "plain-with-id-link" && (<span className={Scss.entityId}>{resourceManager.renderPrompt("Brackets", [<RdfEntityLink key={0} qName={props.qName} external />])}</span>)}
    </span>);
});
RdfEntityLabel.displayName = "RdfEntityLabel";
RdfEntityLabel.defaultProps = { variant: "plain" };

export interface IRdfEntityDescriptionProps {
    qName: RdfQName;
    fallbackContent?: React.ReactNode;
}

export const RdfEntityDescription: React.FC<IRdfEntityDescriptionProps> = (props) => {
    const language = useDataServiceLanguage(dataService);
    const label = useLabelFor(dataService, props.qName);
    return <span lang={language}>{label && label.description || props.fallbackContent}</span>;
};
RdfEntityDescription.displayName = "RdfEntityDescription";
