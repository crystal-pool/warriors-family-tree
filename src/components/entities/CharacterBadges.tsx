import { Typography } from "@material-ui/core";
import * as React from "react";
import { dataService } from "../../services";
import { characterTimelineBuilder } from "../../timeline";
import { ITimelineAffiliationEvent } from "../../timeline/characterTimeline";
import { TimelineEventTimeRangeLabel } from "../../timeline/rendering";
import { Mars, Venus } from "../../utility/muiIcons";
import { RdfEntityLabel } from "../RdfEntity";
import Scss from "./CharacterBadges.scss";
import { RdfClanSymbol } from "./ClanSymbol";
import { IEntityDrivenComponentProps } from "./types";

function renderCharacterAffiliationTooltip(affiliation: ITimelineAffiliationEvent): React.ReactNode {
    return (<>
        <Typography variant="subtitle1"><RdfEntityLabel qName={affiliation.group} /></Typography>
        <TimelineEventTimeRangeLabel event={affiliation} />
    </>);
}

export const CharacterBadges: React.FC<IEntityDrivenComponentProps> = function CharacterBadges(props) {
    const profile = dataService.getCharacterProfileFor(props.qName);
    const gender = profile?.gender;
    const currentAffiliations = characterTimelineBuilder.getAffiliations(props.qName, true);
    return (<span className={Scss.badges}>
        {gender === "male" && <Mars className={Scss.badge} />}
        {gender === "female" && <Venus className={Scss.badge} />}
        {currentAffiliations.map((a, i) => (<RdfClanSymbol
            key={i} className={Scss.badge}
            qName={a.group}
            title={renderCharacterAffiliationTooltip(a)}
        />))}
    </span>
    );
};
