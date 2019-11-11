import { Tooltip } from "@material-ui/core";
import classNames from "classnames";
import * as React from "react";
import { RdfQName } from "../services/dataService";
import scss from "./ClanSymbol.scss";
import { RdfEntityLabel } from "./RdfEntity";

export interface IClanSymbolProps {
    className?: string;
}

export const ThunderClan: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>ThC</div>;
};

export const WindClan: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>WiC</div>;
};

export const ShadowClan: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>ShC</div>;
};

export const RiverClan: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>RiC</div>;
};

export const SkyClan: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>SkC</div>;
};

export const StarClan: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>StC</div>;
};

export const Kittypet: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>Ktp</div>;
};

export const Loner: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>Lon</div>;
};

export const Rogue: React.FC<IClanSymbolProps> = (props) => {
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>Rog</div>;
};

export interface IRdfClanSymbolProps extends IClanSymbolProps {
    qName: RdfQName;
}

const clanLookup: Record<RdfQName, React.FC<IClanSymbolProps> | string> = {
    "wd:Q627": ThunderClan,
    "wd:Q628": ShadowClan,
    "wd:Q630": RiverClan,
    "wd:Q631": WindClan,
    "wd:Q632": SkyClan,
    "wd:Q634": StarClan,
    "wd:Q635": "DaF",
    "wd:Q638": "mTRW",
    "wd:Q639": "aTRW",
    "wd:Q640": "TEH",
    "wd:Q645": "mTiC",
    "wd:Q646": "mLiC",
    "wd:Q647": Kittypet,
    "wd:Q648": Loner,
    "wd:Q649": Rogue,
    "wd:Q664": "Non",
};

const RdfClanSymbolCore: React.FC<IRdfClanSymbolProps> = React.forwardRef((props) => {
    const ClanComponent = clanLookup[props.qName];
    if (typeof ClanComponent === "string") return <div className={classNames(scss.clanSymbolFallback, props.className)}>{ClanComponent}</div>;
    if (ClanComponent) return <ClanComponent className={props.className} />;
    return <div className={classNames(scss.clanSymbolFallback, props.className)}>??</div>;
});
RdfClanSymbolCore.displayName = "RdfClanSymbolCore";

export const RdfClanSymbol: React.FC<IRdfClanSymbolProps> = (props) => {
    return (<Tooltip title={<RdfEntityLabel qName={props.qName} />}><RdfClanSymbolCore {...props} /></Tooltip>);
};
RdfClanSymbol.displayName = "RdfClanSymbol";
