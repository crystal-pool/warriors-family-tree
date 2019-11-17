import { Button, Card, CardActions, CardContent, Typography } from "@material-ui/core";
import * as React from "react";
import { useLocation } from "react-router";
import { resourceManager } from "../localization";
import { routePathBuilders } from "../pages/routes";
import { dataService } from "../services";
import { RdfQName } from "../services/dataService";
import { characterTimelineBuilder } from "../timeline";
import { ITimelineAffiliationEvent, TimelineTime } from "../timeline/characterTimeline";
import { Mars, Venus } from "../utility/muiIcons";
import Scss from "./CharacterCard.scss";
import { CharacterInfobox } from "./CharacterInfobox";
import { RdfClanSymbol } from "./ClanSymbol";
import { RdfEntityDescription, RdfEntityLabel } from "./RdfEntity";

export interface ICharacterCardProps {
    qName: RdfQName;
}

function renderCharacterAffiliationTooltip(affiliation: ITimelineAffiliationEvent): React.ReactNode {
    function renderTimelineTime(time: TimelineTime): React.ReactNode {
        if (time === "unknown") return "??";
        if (time.offsetMonths) {
            return (<><RdfEntityLabel qName={time.marker} />(+{time.offsetMonths}moons)</>);
        }
        return <RdfEntityLabel qName={time.marker} />;
    }
    return (<>
        <Typography variant="subtitle1"><RdfEntityLabel qName={affiliation.group} /></Typography>
        {(affiliation.startTime || affiliation.endTime)
            ? <>
                {affiliation.startTime && renderTimelineTime(affiliation.startTime)}
                &mdash;
            {affiliation.endTime ? renderTimelineTime(affiliation.endTime) : resourceManager.getPrompt("TimelineUntilNow")}
            </>
            : resourceManager.getPrompt("MissingTimelineInformation")}
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
                <RdfEntityLabel qName={props.qName} showEntityId={true} />
                <span className={Scss.badges}>
                    {gender === "male" && <Mars className={Scss.badge} fontSize="inherit" />}
                    {gender === "female" && <Venus className={Scss.badge} fontSize="inherit" />}
                    {currentAffiliations.map((a, i) => (<RdfClanSymbol
                        key={i} className={Scss.badge}
                        qName={a.group}
                        title={renderCharacterAffiliationTooltip(a)}
                    />))}
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
