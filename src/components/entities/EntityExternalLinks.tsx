import { Link } from "@material-ui/core";
import * as React from "react";
import { dataService } from "../../services";
import { buildFeatureAnchorProps } from "../../utility/featureUsage";
import Scss from "./EntityExternalLinks.scss";
import { IEntityDrivenComponentProps } from "./types";

interface KnownSiteInfo {
    href: string;
}

const knownSites: Record<string, KnownSiteInfo> = {
    crystalpool: { href: "https://crystalpool.cxuesong.com/" },
    zhwarriorswiki: { href: "https://warriors.huijiwiki.com/" },
    fiwarriorswiki: { href: "https://soturikissat.fandom.com/fi/" },
    ukwarriorswiki: { href: "https://uawarriors.fandom.com/uk/" },
    nlwarriorswiki: { href: "https://warriorcats.fandom.com/nl/" },
    ltwarriorswiki: { href: "https://klanukariailt.fandom.com/lt/" },
    frwarriorswiki: { href: "https://lgdc.fandom.com/fr/" },
    eswarriorswiki: { href: "https://gatosguerreros.fandom.com/es/" },
    itwarriorswiki: { href: "https://warriors.fandom.com/it/" },
    ruwarriorswiki: { href: "https://warriors-cats.fandom.com/ru/" },
    enwarriorswiki: { href: "https://warriors.fandom.com/" },
    dewarriorswiki: { href: "https://warrior-cats.fandom.com/de/" },
    cswarriorswiki: { href: "https://valecnici.fandom.com/cs/" },
    plwarriorswiki: { href: "https://wojownicy.fandom.com/pl/" }
};

function matchSiteKey(pageHref: string): string | undefined {
    let match: string | undefined;
    let prevPrefixLength = 0;
    for (const key in knownSites) {
        if (!knownSites.hasOwnProperty(key)) continue;
        const { href } = knownSites[key];
        if (href.length > prevPrefixLength && pageHref.startsWith(href)) {
            match = key;
        }
    }
    return match;
}

export const EntityExternalLinks: React.FC<IEntityDrivenComponentProps> = function EntityExternalLinks(props) {
    const { qName } = props;
    const rawLinks = dataService.getLinksFor(qName);
    const links = rawLinks.map(l => ({
        href: l.href,
        name: l.name,
        site: matchSiteKey(l.href) ?? l.site.replace(/^https?:\/\//i, "")
    })).sort((x, y) => x.site > y.site ? 1 : x.site < y.site ? -1 : 0);
    return (<ul className={Scss.externalLinks}>
        {links.map((l, i) => (<li key={i}>
            <span className={Scss.linkSite}>{l.site}</span>
            <Link href={l.href} target="_blank" {...buildFeatureAnchorProps("navigation.external.entity.site")}>{l.name || l.href}</Link>
        </li>))}
    </ul>);
};
