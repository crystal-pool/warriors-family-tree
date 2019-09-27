import { Button, Card, CardActions, CardContent } from "@material-ui/core";
import * as React from "react";
import { routePathBuilders } from "../pages/routes";
import { RdfQName } from "../services/dataService";
import { CharacterInfobox } from "./CharacterInfobox";
import { RdfEntityDescription, RdfEntityLabel } from "./RdfEntity";

export interface ICharacterCardProps {
    qName: RdfQName;
}

export const CharacterCard: React.FC<ICharacterCardProps> = React.memo((props) => {
    return (<Card className="character-card">
        <CardContent>
            <h3><RdfEntityLabel qName={props.qName} showEntityId={true} /></h3>
            <p><RdfEntityDescription qName={props.qName} /></p>
            <CharacterInfobox qName={props.qName} />
        </CardContent>
        <CardActions>
            <Button href={routePathBuilders.familyTree({ character: props.qName })}>Family tree</Button>
        </CardActions>
    </Card>);
});
