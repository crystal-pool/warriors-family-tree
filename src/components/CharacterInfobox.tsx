import { Table, TableBody, TableCell, TableRow } from "@material-ui/core";
import * as React from "react";
import { resourceManager } from "../localization";
import { PromptKey } from "../localization/prompts";
import { dataService } from "../services";
import { ICharacterRelationEntry, RdfQName } from "../services/dataService";
import { RdfEntityLabel } from "./RdfEntity";

export interface ICharacterInfoboxProps {
    qName: RdfQName;
}

function renderRelationEntries(entries: Iterable<ICharacterRelationEntry>): React.ReactNode {
    const items = Array.from(entries);
    if (items.length === 0) return undefined;
    return items.map((entry, i) => (<React.Fragment key={i}>
        {i > 0 && resourceManager.getPrompt("ListSeparator")}
        <RdfEntityLabel qName={entry.target} variant="link" />
    </React.Fragment>));
}

function getInfoboxItems(qName: RdfQName): [string, React.ReactNode][] {
    const relations = dataService.getRelationsFor(qName);
    if (!relations) return [];
    function buildRow(prompt1: PromptKey, promptn: PromptKey, items: ICharacterRelationEntry[]): [string, React.ReactNode] {
        return [resourceManager.getPrompt(items.length > 1 ? promptn : prompt1), renderRelationEntries(items)];
    }
    return ([
        buildRow("CharacterParent", "CharacterParents", relations.filter(r => r.relation === "parent")),
        buildRow("CharacterMate", "CharacterMates", relations.filter(r => r.relation === "mate")),
        buildRow("CharacterChild", "CharacterChildren", relations.filter(r => r.relation === "child")),
        buildRow("CharacterMentor", "CharacterMentors", relations.filter(r => r.relation === "mentor")),
        buildRow("CharacterApprentice", "CharacterApprentices", relations.filter(r => r.relation === "apprentice")),
    ]).filter(([label, value]) => value);
}

export const CharacterInfobox: React.FC<ICharacterInfoboxProps> = (props) => {
    const items = getInfoboxItems(props.qName);
    if (items.length === 0) return null;
    return (<Table size="small" style={{wordBreak: "keep-all"}}>
        <TableBody>
            {items.map(([label, value]) => (<TableRow key={label}>
                <TableCell variant="head">{label}</TableCell>
                <TableCell>{value}</TableCell>
            </TableRow>))}
        </TableBody>
    </Table>);
};
