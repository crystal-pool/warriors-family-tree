import { Button, Link } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { resourceManager } from "../../localization";
import { routePathBuilders, useKnownRouteMatch } from "../../pages";
import Scss from "./actionLinks.scss";
import { IEntityDrivenComponentProps } from "./types";

export interface IActionLinksProps extends IEntityDrivenComponentProps {
    className?: string;
    displayAs?: "link" | "button";
}

type ActionLinkEntry = [string, string | undefined];

function renderActionLinks(actions: ActionLinkEntry[], className?: string, displayAs?: IActionLinksProps["displayAs"]) {
    displayAs = displayAs || "link";
    return <ul className={classNames(Scss.actionLinks, Scss[displayAs], className)}>{actions.map(([label, href], i) => {
        let content: React.ReactNode = null;
        if (displayAs === "button") {
            content = href == null ? <Button className={Scss.link} disabled>{label}</Button> : <Button className={Scss.link} href={href}>{label}</Button>;
        } else {
            content = href == null ? <span className={Scss.link}>{label}</span> : <Link className={Scss.link} href={href}>{label}</Link>;
        }
        return <li key={i} className={classNames(href == null && Scss.current)}>{content}</li>;
    })}</ul>;
}

export const CharacterActionLinks: React.FC<IActionLinksProps> = function CharacterActionLinks(props) {
    const { qName, className } = props;
    const loc = useLocation();
    const match = useKnownRouteMatch();
    const actions: ActionLinkEntry[] = [];
    actions.push([resourceManager.getPrompt("EntityProfileTitle"),
    match?.route === "entityProfile" && match.params.qName === qName
        ? undefined
        : routePathBuilders.entityProfile({ qName: props.qName }, loc.search)]);
    actions.push([resourceManager.getPrompt("FamilyTreeTitle"),
    match?.route === "familyTree" && match.params.character === qName
        ? undefined
        : routePathBuilders.familyTree({ character: props.qName }, loc.search)]);
    return renderActionLinks(actions, className, props.displayAs);
};
