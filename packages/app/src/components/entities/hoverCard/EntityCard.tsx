import { styled } from "@mui/material/styles";
import * as React from "react";
import { dataService } from "../../../services";
import { RdfQName } from "../../../services/dataService";
import { buildUiScopeProps } from "../../../utility/featureUsage";
import { LogicallyParentedTooltip } from "../../mui";
import { CharacterCard } from "./CharacterCard";
import { DefaultCard } from "./DefaultCard";

export interface IEntityCardProps {
    qName: RdfQName;
}

export const EntityCard: React.FC<IEntityCardProps> = function EntityCard(props) {
    const { qName } = props;
    if (dataService.getCharacterProfileFor(qName)) return <CharacterCard qName={qName} />;
    return <DefaultCard qName={qName} />;
};

const HoverTooltip = styled(LogicallyParentedTooltip)(({ theme }) => ({
    [`& .MuiTooltip-tooltip`]: {
        padding: "0",
        backgroundColor: "unset",
        boxShadow: theme.shadows[1],
        fontSize: "unset",
        fontWeight: "unset"
    },
}));

export interface IEntityHoverCardProps extends IEntityCardProps {
    children: React.ReactElement;
}

export const EntityHoverCard: React.FC<IEntityHoverCardProps> = function EntityHoverCard(props) {
    return (<HoverTooltip
        title={<EntityCard qName={props.qName} />}
        enterDelay={300} leaveDelay={300}
        slotProps={{ popper: buildUiScopeProps("entityCard") as {} }}
    >{props.children}</HoverTooltip>);
};
