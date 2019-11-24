import { Table, TableBody, TableCell, TableRow } from "@material-ui/core";
import * as React from "react";
import { resourceManager } from "../localization";
import { PromptKey } from "../localization/prompts";
import { CharacterRelationType, RdfQName } from "../services/dataService";
import { characterTimelineBuilder } from "../timeline";
import { ITimelineRelationEvent } from "../timeline/characterTimeline";
import { TimelineEventTimeRangeLabel } from "../timeline/rendering";
import { RdfEntityLabel } from "./RdfEntity";

export interface ICharacterInfoboxProps {
    qName: RdfQName;
    compact?: boolean;
    valueClassName?: string;
    onRenderEntityTooltip?: (children: React.ReactElement, qName: string) => React.ReactNode;
}

function renderRelationEntries(entries: Iterable<ITimelineRelationEvent>, props: ICharacterInfoboxProps): React.ReactNode {
    const { compact, valueClassName, onRenderEntityTooltip } = props;
    const items = Array.from(entries);
    if (items.length === 0) return undefined;
    if (compact) {
        return (<span>{
            items.map((entry, i) => (<React.Fragment key={i}>
                {i > 0 && resourceManager.getPrompt("ListSeparator")}
                <RdfEntityLabel qName={entry.target} variant="link" />
            </React.Fragment>))
        }</span>);
    } else {
        return (<ul className={valueClassName}>{
            items.map((entry, i) => (<li key={i}>
                {
                    onRenderEntityTooltip
                        ? onRenderEntityTooltip(<RdfEntityLabel qName={entry.target} variant="link" />, entry.target)
                        : <RdfEntityLabel qName={entry.target} variant="link" />
                }
                <ul>
                    <li><TimelineEventTimeRangeLabel event={entry} /></li>
                </ul>
            </li>))
        }</ul>);
    }
}

function getInfoboxItems(qName: RdfQName, props: ICharacterInfoboxProps): [string, React.ReactNode][] {
    function getRelations(relationType: CharacterRelationType) {
        return characterTimelineBuilder.getRelations(qName, relationType);
    }
    function buildRow(prompt1: PromptKey, promptn: PromptKey, items: ITimelineRelationEvent[]): [string, React.ReactNode] {
        return [resourceManager.getPrompt(items.length > 1 ? promptn : prompt1), renderRelationEntries(items, props)];
    }
    return ([
        buildRow("CharacterParent", "CharacterParents", getRelations("parent")),
        buildRow("CharacterMate", "CharacterMates", getRelations("mate")),
        buildRow("CharacterChild", "CharacterChildren", getRelations("child")),
        buildRow("CharacterMentor", "CharacterMentors", getRelations("mentor")),
        buildRow("CharacterApprentice", "CharacterApprentices", getRelations("apprentice")),
    ]).filter(([label, value]) => value);
}

export const CharacterRelationInfobox: React.FC<ICharacterInfoboxProps> = function CharacterRelationInfobox(props) {
    const items = getInfoboxItems(props.qName, props);
    if (items.length === 0) return null;
    return (<Table size="small" style={{ wordBreak: "keep-all" }}>
        <TableBody>
            {items.map(([label, value]) => (<TableRow key={label}>
                <TableCell variant="head">{label}</TableCell>
                <TableCell>{value}</TableCell>
            </TableRow>))}
        </TableBody>
    </Table>);
};
