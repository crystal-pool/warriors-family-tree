import * as React from "react";
import { CharacterInfobox } from "../../components/CharacterInfobox";

export interface ICharacterEntityDetailsProps {
    qName: string;
}

export const CharacterEntityDetails: React.FC<ICharacterEntityDetailsProps> = (props) => {
    const { qName } = props;
    return (<>
        <CharacterInfobox qName={qName} />
    </>);
};
