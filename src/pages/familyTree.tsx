import * as React from "react";
import { match } from "react-router";

export interface IFamilyTreeRoutingParams {
    character?: string;
}

export interface IFamilyTreeProps {
    match: match<IFamilyTreeRoutingParams>;
}

export const FamilyTree: React.FC<IFamilyTreeProps> = (props) => {
    return <div>Family Tree: {props.match.params.character}</div>;
};
