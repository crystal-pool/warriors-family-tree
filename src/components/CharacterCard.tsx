import { Button, Card, CardActions, CardContent, Typography } from "@material-ui/core";
import * as React from "react";
import { useLocation } from "react-router";
import { resourceManager } from "../localization";
import { routePathBuilders } from "../pages/routes";
import { dataService } from "../services";
import { RdfQName } from "../services/dataService";
import { characterTimelineBuilder } from "../timeline";
import { ITimelineAffiliationEvent } from "../timeline/characterTimeline";
import { TimelineEventTimeRangeLabel } from "../timeline/rendering";
import { Mars, Venus } from "../utility/muiIcons";
import Scss from "./CharacterCard.scss";
import { CharacterRelationInfobox } from "./CharacterInfobox";
import { RdfClanSymbol } from "./ClanSymbol";
import { RdfEntityDescription, RdfEntityLabel } from "./RdfEntity";

export interface ICharacterCardProps {
    qName: RdfQName;
}

function renderCharacterAffiliationTooltip(affiliation: ITimelineAffiliationEvent): React.ReactNode {
    return (<>
        <Typography variant="subtitle1"><RdfEntityLabel qName={affiliation.group} /></Typography>
        <TimelineEventTimeRangeLabel event={affiliation} />
    </>);
}

export const CharacterCard: React.FC<ICharacterCardProps> = React.memo((props) => {
    const loc = useLocation();
    const profile = dataService.getCharacterProfileFor(props.qName);
    const gender = profile?.gender;
    const currentAffiliations = characterTimelineBuilder.getAffiliations(props.qName, true);
    return (<Card className={Scss.characterCard}>
        <CardContent>
            <h3>
                <RdfEntityLabel qName={props.qName} variant="plain-with-id-link" />
                <span className={Scss.badges}>
                    {gender === "male" && <Mars className={Scss.badge} />}
                    {gender === "female" && <Venus className={Scss.badge} />}
                    {currentAffiliations.map((a, i) => (<RdfClanSymbol
                        key={i} className={Scss.badge}
                        qName={a.group}
                        title={renderCharacterAffiliationTooltip(a)}
                    />))}
                </span>
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
