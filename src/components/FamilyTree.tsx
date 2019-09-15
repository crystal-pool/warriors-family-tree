import * as d3 from "d3";
import * as React from "react";
import { ICharacterRelationEntry } from "../services/dataService";
import { RdfEntityLabel } from "./RdfEntity";

export interface IFamilyTreeNode {
    id: string;
    parentId1?: string;
    parentId2?: string;
    render(this: IFamilyTreeNode): React.ReactNode;
}

interface IAuxilaryNode {
    id: string;
}

// d3.stratify<ICharacterRelationEntry>()
// .id(c => c.subject)
// .parentId(c => c.);
// const tree = d3.tree();

export interface IFamilyTreeProps {
    nodes: Readonly<IFamilyTreeNode[]>;
}

export const FamilyTree: React.FC<IFamilyTreeProps> = (props) => {
    return (
        <div>
            <p>Length: {props.nodes.length}</p>
            {props.nodes.map(n => (<div key={n.id}>
                <RdfEntityLabel qName={n.id} />
                <pre>{JSON.stringify(n, undefined, 4)}</pre>
            </div>))}
        </div>
    );
};
