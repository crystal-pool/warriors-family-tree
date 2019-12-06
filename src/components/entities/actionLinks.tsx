import { Button, Link } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { resourceManager } from "../../localization";
import { routePathBuilders, useKnownRouteMatch } from "../../pages";
import { buildFeatureAnchorProps, buildUiScopeProps } from "../../utility/featureUsage";
import Scss from "./actionLinks.scss";
import { IEntityDrivenComponentProps } from "./types";

export interface IActionLinksProps extends IEntityDrivenComponentProps {
    className?: string;
    displayAs?: "link" | "button";
}

type ActionLinkEntry = [string, string, string | undefined];

function renderActionLinks(actions: ActionLinkEntry[], className?: string, displayAs?: IActionLinksProps["displayAs"]) {
    displayAs = displayAs || "link";
    return <ul
        className={classNames(Scss.actionLinks, Scss[displayAs], className)}
        {...buildUiScopeProps("entityActions")}
    >{actions.map(([name, label, href], i) => {
        let content: React.ReactNode = null;
        if (displayAs === "button") {
            content = href == null
                ? <Button className={Scss.link} disabled>{label}</Button>
                : <Button className={Scss.link} href={href} {...buildFeatureAnchorProps("navigation.entity." + name)}>{label}</Button>;
        } else {
            content = href == null ? <span className={Scss.link}>{label}</span>
                : <Link className={Scss.link} href={href} {...buildFeatureAnchorProps("navigation.entity." + name)}>{label}</Link>;
        }
        return <li key={i} className={classNames(href == null && Scss.current)}>{content}</li>;
    })}</ul>;
}

export const CharacterActionLinks: React.FC<IActionLinksProps> = function CharacterActionLinks(props) {
    const { qName, className } = props;
    const loc = useLocation();
    const match = useKnownRouteMatch();
    const actions: ActionLinkEntry[] = [];
    actions.push(["profile", resourceManager.getPrompt("EntityProfileTitle"),
        match?.route === "entityProfile" && match.params.qName === qName
            ? undefined
            : routePathBuilders.entityProfile({ qName: props.qName }, loc.search)]);
    actions.push(["familyTree", resourceManager.getPrompt("FamilyTreeTitle"),
        match?.route === "familyTree" && match.params.character === qName
            ? undefined
            : routePathBuilders.familyTree({ character: props.qName }, loc.search)]);
    return renderActionLinks(actions, className, props.displayAs);
};
