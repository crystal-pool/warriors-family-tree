import { Grid, Link } from "@material-ui/core";
import _ from "lodash";
import * as React from "react";
import { useLocation } from "react-router-dom";
import wu from "wu";
import { CharacterRelationInfobox } from "../../components/CharacterInfobox";
import { RdfClanSymbol } from "../../components/ClanSymbol";
import { EntityHoverCard } from "../../components/entityHoverCard/EntityCard";
import { CharacterFamilyTree } from "../../components/familyTree/CharacterFamilyTree";
import { RdfEntityLabel } from "../../components/RdfEntity";
import { resourceManager } from "../../localization";
import { choosePerferredLanguage, KnownLanguage, languageInfo } from "../../localization/languages";
import { useLanguage } from "../../localization/react";
import { characterTimelineBuilder } from "../../timeline";
import { TimelineEventTimeRangeLabel } from "../../timeline/rendering";
import { resetQueryParams } from "../../utility/queryParams";
import { routePathBuilders } from "../routes";
import entityPageScss from "./entityPage.scss";

export interface ICharacterEntityDetailsProps {
    qName: string;
}

function renderCharacterName(names: readonly [string, string][], languagePreferrence: string[]): React.ReactNode {
    if (names.length === 0 || languagePreferrence.length === 0) return "??";
    const knownLanguages = new Set(wu(names).map(([t, l]) => l));
    const language = choosePerferredLanguage(knownLanguages, languagePreferrence);
    if (!language) return "??";
    return <>
        <span lang={language}>{names.filter(([t, l]) => l === language).map(([t, l]) => t).join(resourceManager.getPrompt("ListSeparator"))}
            {language !== languagePreferrence[0] &&
                <span className={entityPageScss.fallbackLabelLanguageBadge}>{resourceManager.getPrompt("Brackets", [languageInfo[language as KnownLanguage]?.autonym || language])}</span>
            }
        </span>
    </>;
}

function renderNames(qName: string, languagePreferrence: string[]): React.ReactNode {
    const names = characterTimelineBuilder.getNames(qName);
    return (<ul>
        {names.map((n, i) => <li key={i}>
            {renderCharacterName(n.names, languagePreferrence)}
            <ul>
                <li><TimelineEventTimeRangeLabel event={n} /></li>
            </ul>
        </li>)}
    </ul>);
}

function renderAffiliations(qName: string): React.ReactNode {
    const aff = characterTimelineBuilder.getAffiliations(qName);
    return (<ul>
        {aff.map((a, i) => (
            <li key={i}>
                <EntityHoverCard qName={a.group}>
                    <span>
                        <RdfClanSymbol className={entityPageScss.clanIconDecorator} qName={a.group} title={null} />
                        <RdfEntityLabel qName={a.group} variant="link" />
                    </span>
                </EntityHoverCard>
                <ul>
                    <li><TimelineEventTimeRangeLabel event={a} /></li>
                </ul>
            </li>
        ))}
    </ul>);
}

function renderPositionsHeld(qName: string): React.ReactNode {
    const pos = characterTimelineBuilder.getPositionsHeld(qName);
    return (<ul>
        {pos.map((a, i) => (
            <li key={i}>
                {a.of && <>
                    <EntityHoverCard qName={a.of}>
                        <span>
                            <RdfClanSymbol className={entityPageScss.clanIconDecorator} qName={a.of} title={null} />
                            <RdfEntityLabel qName={a.of} variant="link" />
                        </span>
                    </EntityHoverCard>
                    &mdash;
                </>}
                <EntityHoverCard qName={a.position}>
                    <RdfEntityLabel qName={a.position} variant="link" />
                </EntityHoverCard>
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
    const appLanguage = useLanguage();
    const languagePref = React.useMemo(() => {
        return _.uniq([appLanguage, navigator.language, ...navigator.languages]);
    }, [appLanguage]);
    // const profile = dataService.getCharacterProfileFor(qName);
    // const { gender } = profile || {};
    return (<>
        <Grid container spacing={3}>
            <Grid item md={5}>
                <h2>{resourceManager.getPrompt("NamesTitle")}</h2>
                {renderNames(qName, languagePref)}
                <h2>{resourceManager.getPrompt("AffiliationsTitle")}</h2>
                {renderAffiliations(qName)}
                <h2>{resourceManager.getPrompt("PositionsHeldTitle")}</h2>
                {renderPositionsHeld(qName)}
            </Grid>
            <Grid item md={7}>
                <h2>{resourceManager.getPrompt("RelationsTitle")}</h2>
                <CharacterRelationInfobox
                    qName={qName}
                    onRenderEntityTooltip={(children, q) => <EntityHoverCard qName={q}>{children}</EntityHoverCard>}
                />
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
