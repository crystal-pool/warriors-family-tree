import { Link } from "@material-ui/core";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { CharacterInfobox } from "../../components/CharacterInfobox";
import { CharacterFamilyTree } from "../../components/familyTree/CharacterFamilyTree";
import { resourceManager } from "../../localization";
import { resetQueryParams } from "../../utility/queryParams";
import { routePathBuilders } from "../routes";
import entityPageScss from "./entityPage.scss";

export interface ICharacterEntityDetailsProps {
    qName: string;
}

export const CharacterEntityDetails: React.FC<ICharacterEntityDetailsProps> = (props) => {
    const { qName } = props;
    const loc = useLocation();
    return (<>
        <CharacterInfobox qName={qName} />
        <h2>{resourceManager.getPrompt("FamilyTreeTitle")}<span className={entityPageScss.actionBadge}>
            <Link href={routePathBuilders.familyTree({ character: qName }, resetQueryParams(loc.search))}>{resourceManager.getPrompt("More")}</Link>
        </span></h2>
        <CharacterFamilyTree
            onNodeClick={(qName) => { location.href = routePathBuilders.entityProfile({ qName }, loc.search); }}
            emptyPlaceholder={<>
                <h3>{resourceManager.getPrompt("NoFamilyTreeInformation")}</h3>
            </>}
            centerQName={qName} maxDistance={3}
        />
    </>);
};
