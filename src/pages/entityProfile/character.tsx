import * as React from "react";
import { CharacterInfobox } from "../../components/CharacterInfobox";
import { CharacterFamilyTree } from "../../components/familyTree/CharacterFamilyTree";
import { resourceManager } from "../../localization";

export interface ICharacterEntityDetailsProps {
    qName: string;
}

export const CharacterEntityDetails: React.FC<ICharacterEntityDetailsProps> = (props) => {
    const { qName } = props;
    return (<>
        <CharacterInfobox qName={qName} />
        <h2>{resourceManager.getPrompt("FamilyTreeTitle")}</h2>
        <CharacterFamilyTree centerQName={qName} maxDistance={3} />
    </>);
};
