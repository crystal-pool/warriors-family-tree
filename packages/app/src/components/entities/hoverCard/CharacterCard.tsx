import { Card, CardActions, CardContent } from "@material-ui/core";
import * as React from "react";
import { RdfQName } from "../../../services/dataService";
import { RdfEntityDescription, RdfEntityLabel } from "../../RdfEntity";
import { CharacterActionLinks } from "../actionLinks";
import { CharacterBadges } from "../CharacterBadges";
import { CharacterRelationInfobox } from "../CharacterInfobox";

export interface ICharacterCardProps {
    qName: RdfQName;
}

export const CharacterCard: React.FC<ICharacterCardProps> = React.memo((props) => {
    const {qName} = props;
    return (<Card>
        <CardContent>
            <h3>
                <RdfEntityLabel qName={qName} variant="plain-with-id-link" />
                <CharacterBadges qName={qName} />
            </h3>
            <p><RdfEntityDescription qName={qName} /></p>
            <CharacterRelationInfobox qName={qName} compact />
        </CardContent>
        <CardActions>
            <CharacterActionLinks qName={qName} displayAs="button" />
        </CardActions>
    </Card>);
});
