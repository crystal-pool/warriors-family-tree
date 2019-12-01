import { RdfQName } from "./dataService";

export const rdfNamespaceMap: { [prefix: string]: string } = {
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    owl: "http://www.w3.org/2002/07/owl#",
    wikibase: "http://wikiba.se/ontology#",
    wds: "https://crystalpool.cxuesong.com/entity/statement/",
    wdata: "https://crystalpool.cxuesong.com/wiki/Special:EntityData/",
    skos: "http://www.w3.org/2004/02/skos/core#",
    schema: "http://schema.org/",
    cc: "http://creativecommons.org/ns#",
    geo: "http://www.opengis.net/ont/geosparql#",
    prov: "http://www.w3.org/ns/prov#",
    wdref: "https://crystalpool.cxuesong.com/reference/",
    wdv: "https://crystalpool.cxuesong.com/value/",
    wd: "https://crystalpool.cxuesong.com/entity/",
    wdt: "https://crystalpool.cxuesong.com/prop/direct/",
    wdtn: "https://crystalpool.cxuesong.com/prop/direct-normalized/",
    p: "https://crystalpool.cxuesong.com/prop/",
    ps: "https://crystalpool.cxuesong.com/prop/statement/",
    psv: "https://crystalpool.cxuesong.com/prop/statement/value/",
    psn: "https://crystalpool.cxuesong.com/prop/statement/value-normalized/",
    pq: "https://crystalpool.cxuesong.com/prop/qualifier/",
    pqv: "https://crystalpool.cxuesong.com/prop/qualifier/value/",
    pqn: "https://crystalpool.cxuesong.com/prop/qualifier/value-normalized/",
    pr: "https://crystalpool.cxuesong.com/prop/reference/",
    prv: "https://crystalpool.cxuesong.com/prop/reference/value/",
    prn: "https://crystalpool.cxuesong.com/prop/reference/value-normalized/",
    wdno: "https://crystalpool.cxuesong.com/prop/novalue/",
};

export function tryGetFullUri(qName: RdfQName): string | undefined {
    const colonPos = qName.indexOf(":");
    if (colonPos < 0) return undefined;
    const prefix = qName.substr(0, colonPos);
    const prefixUri = rdfNamespaceMap[prefix];
    if (!prefixUri) return undefined;
    return prefixUri + qName.substr(colonPos + 1);
}
