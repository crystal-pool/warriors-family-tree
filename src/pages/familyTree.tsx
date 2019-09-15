import { Typography } from "@material-ui/core";
import * as React from "react";
import { match } from "react-router";
import { RdfEntityDescription, RdfEntityLabel } from "../components/RdfEntity";

export interface IFamilyTreeRoutingParams {
    character?: string;
}

export interface IFamilyTreeProps {
    match: match<IFamilyTreeRoutingParams>;
}

export const FamilyTree: React.FC<IFamilyTreeProps> = (props) => {
    let characterId = props.match.params.character;
    if (!characterId) {
        return <span>No character ID specified.</span>;
    }
    if (characterId.indexOf(":") < 0) characterId = "wd:" + characterId;
    return (<React.Fragment>
        <h1>Family tree of <RdfEntityLabel qName={characterId} showEntityId={true} /></h1>
        <Typography variant="subtitle1"><RdfEntityDescription qName={characterId} /></Typography>
    </React.Fragment>);
};
