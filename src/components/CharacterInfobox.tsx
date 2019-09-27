import { Table, TableBody, TableCell, TableRow } from "@material-ui/core";
import * as React from "react";
import wu from "wu";
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
        {i > 0 && ", "}<RdfEntityLabel qName={entry.target} />
    </React.Fragment>));
}

function getInfoboxItems(qName: RdfQName): [string, React.ReactNode][] {
    const relations = dataService.getRelationsFor(qName);
    if (!relations) return [];
    return ([
        ["Parents", renderRelationEntries(wu(relations).filter(r => r.relation === "parent"))],
        ["Mates", renderRelationEntries(wu(relations).filter(r => r.relation === "mate"))],
        ["Children", renderRelationEntries(wu(relations).filter(r => r.relation === "child"))],
        ["Mentors", renderRelationEntries(wu(relations).filter(r => r.relation === "mentor"))],
        ["Apprentices", renderRelationEntries(wu(relations).filter(r => r.relation === "apprentice"))],
    ] as [string, React.ReactNode][]).filter(([label, value]) => value);
}

export const CharacterInfobox: React.FC<ICharacterInfoboxProps> = (props) => {
    const items = getInfoboxItems(props.qName);
    if (items.length === 0) return null;
    return (<Table size="small">
        <TableBody>
            {items.map(([label, value]) => (<TableRow key={label}>
                <TableCell>{label}</TableCell>
                <TableCell>{value}</TableCell>
            </TableRow>))}
        </TableBody>
    </Table>);
};
