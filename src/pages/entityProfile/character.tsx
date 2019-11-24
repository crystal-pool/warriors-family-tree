import { Grid, Link } from "@material-ui/core";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { CharacterRelationInfobox } from "../../components/CharacterInfobox";
import { RdfClanSymbol } from "../../components/ClanSymbol";
import { CharacterFamilyTree } from "../../components/familyTree/CharacterFamilyTree";
import { RdfEntityLabel } from "../../components/RdfEntity";
import { resourceManager } from "../../localization";
import { characterTimelineBuilder } from "../../timeline";
import { TimelineEventTimeRangeLabel } from "../../timeline/rendering";
import { resetQueryParams } from "../../utility/queryParams";
import { routePathBuilders } from "../routes";
import entityPageScss from "./entityPage.scss";

export interface ICharacterEntityDetailsProps {
    qName: string;
}

function renderAffiliations(qName: string): React.ReactNode {
    const aff = characterTimelineBuilder.getAffiliations(qName);
    return (<ul>
        {aff.map((a, i) => (
            <li key={i}>
                <RdfClanSymbol qName={a.group} />
                <RdfEntityLabel qName={a.group} variant="link" />
                <ul>
                    <li><TimelineEventTimeRangeLabel event={a} /></li>
                </ul>
            </li>
        ))}
    </ul>);
}

export const CharacterEntityDetails: React.FC<ICharacterEntityDetailsProps> = (props) => {
    const { qName } = props;
    const loc = useLocation();
    return (<>
        <Grid container>
            <Grid item md={6}>
                <h2>{resourceManager.getPrompt("AffiliationsTitle")}</h2>
                {renderAffiliations(qName)}
            </Grid>
            <Grid item md={6}>
                <h2>{resourceManager.getPrompt("RelationsTitle")}</h2>
                <CharacterRelationInfobox qName={qName} />
            </Grid>
        </Grid>
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
