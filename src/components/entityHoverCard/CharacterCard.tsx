import { Button, Card, CardActions, CardContent } from "@material-ui/core";
import * as React from "react";
import { useLocation } from "react-router";
import { resourceManager } from "../../localization";
import { routePathBuilders } from "../../pages";
import { RdfQName } from "../../services/dataService";
import { CharacterBadges } from "../entities/CharacterBadges";
import { CharacterRelationInfobox } from "../entities/CharacterInfobox";
import { RdfEntityDescription, RdfEntityLabel } from "../RdfEntity";

export interface ICharacterCardProps {
    qName: RdfQName;
}

export const CharacterCard: React.FC<ICharacterCardProps> = React.memo((props) => {
    const loc = useLocation();
    return (<Card>
        <CardContent>
            <h3>
                <RdfEntityLabel qName={props.qName} variant="plain-with-id-link" />
                <CharacterBadges qName={props.qName} />
            </h3>
            <p><RdfEntityDescription qName={props.qName} /></p>
            <CharacterRelationInfobox qName={props.qName} compact />
        </CardContent>
        <CardActions>
            <Button href={routePathBuilders.familyTree({ character: props.qName }, loc.search)}>{resourceManager.getPrompt("FamilyTreeTitle")}</Button>
            <Button href={routePathBuilders.entityProfile({ qName: props.qName }, loc.search)}>{resourceManager.getPrompt("EntityProfileTitle")}</Button>
        </CardActions>
    </Card>);
});
