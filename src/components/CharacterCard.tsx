import { Button, Card, CardActions, CardContent } from "@material-ui/core";
import * as React from "react";
import { useLocation } from "react-router";
import { resourceManager } from "../localization";
import { routePathBuilders } from "../pages/routes";
import { dataService } from "../services";
import { RdfQName } from "../services/dataService";
import { characterTimelineBuilder } from "../timeline";
import { Mars, Venus } from "../utility/muiIcons";
import Scss from "./CharacterCard.scss";
import { CharacterInfobox } from "./CharacterInfobox";
import { RdfClanSymbol } from "./ClanSymbol";
import { RdfEntityDescription, RdfEntityLabel } from "./RdfEntity";

export interface ICharacterCardProps {
    qName: RdfQName;
}

export const CharacterCard: React.FC<ICharacterCardProps> = React.memo((props) => {
    const loc = useLocation();
    const profile = dataService.getCharacterProfileFor(props.qName);
    const gender = profile?.gender;
    const currentAffiliations = characterTimelineBuilder.getAffiliations(props.qName, true);
    return (<Card className={Scss.characterCard}>
        <CardContent>
            <h3>
                <RdfEntityLabel qName={props.qName} showEntityId={true} />
                <span className={Scss.badges}>
                    {gender === "male" && <Mars className={Scss.badge} fontSize="inherit" />}
                    {gender === "female" && <Venus className={Scss.badge} fontSize="inherit" />}
                    {currentAffiliations.map((a, i) => <RdfClanSymbol key={i} className={Scss.badge} qName={a.group} />)}
                </span>
            </h3>
            <p><RdfEntityDescription qName={props.qName} /></p>
            <CharacterInfobox qName={props.qName} />
        </CardContent>
        <CardActions>
            <Button href={routePathBuilders.familyTree({ character: props.qName }, loc.search)}>{resourceManager.getPrompt("FamilyTreeTitle")}</Button>
        </CardActions>
    </Card>);
});
