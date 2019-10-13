import { CancellationTokenSource, EventEmitter, ICancellationToken, IDisposable, sendRequest } from "tasklike-promise-library";
import wu from "wu";
import { evaluateLanguageSimilarity, browserLanguage } from "../localization/languages";

export type RdfQName = string;

export type CharacterRelationType = "parent" | "child" | "foster-parent" | "foster-child" | "mate" | "mentor" | "apprentice";

export interface ICharacterRelationEntry {
    subject: RdfQName;
    relation: CharacterRelationType;
    target: RdfQName;
    since?: RdfQName;
    until?: RdfQName;
    cause?: RdfQName;
    reliability?: RdfQName;
}

export interface IEntityLabel {
    label?: string;
    description?: string;
}

interface IRelationsRoot {
    relations: { [character: string]: ICharacterRelationEntry[] };
}

interface ILabelsRoot {
    labels: { [entity: string]: [string?, string?] };
}

interface IEntityLookupRoot {
    entries: [string, EntityLookupEntityEntry[]][];
}

// QName, Language, Priority
type EntityLookupEntityEntry = [string, string, number];

export interface IEntityLookupResultItem {
    qName: RdfQName;
    keyword: string;
    keywordMatchRange: [number, number];
    score: number;
}

export class DataService {
    public readonly initialization: PromiseLike<void>;
    private _isInitialized = false;
    private relations: IRelationsRoot | undefined;
    private entityLookup: IEntityLookupRoot | undefined;
    private labels: ILabelsRoot | undefined;
    private _language: string;
    private _switchLanguageCts: CancellationTokenSource | undefined;
    private _languageChanged = new EventEmitter();
    constructor(private _dataPathPrefix: string, language?: string) {
        this._language = language && language.toLowerCase() || browserLanguage;
        this.initialization = this._initialize();
    }
    public get isInitialized(): boolean {
        return this._isInitialized;
    }
    public get language(): string {
        return this._language;
    }
    public set language(value: string) {
        value = value.toLowerCase();
        if (value !== this._language) {
            this._switchLanguageCts && this._switchLanguageCts.cancel();
            this._switchLanguageCts = new CancellationTokenSource();
            this._switchLanguage(value, this._switchLanguageCts.token);
        }
    }
    public onLanguageChanged(listener: () => void): IDisposable {
        return this._languageChanged.addListener(listener);
    }
    public getRelationsFor(
        characterEntityId: RdfQName,
        relationType?: CharacterRelationType | Iterable<CharacterRelationType>
    ): Readonly<ICharacterRelationEntry[]> | undefined {
        if (!this.relations) return undefined;
        const relations = this.relations.relations[characterEntityId];
        if (!relations) return undefined;
        if (!relationType) return relations;
        if (typeof relationType === "string") return relations.filter(r => r.relation === relationType);
        const localRelationTypes = relationType instanceof Set ? relationType as Set<CharacterRelationType> : new Set(relationType);
        return relations.filter(r => localRelationTypes.has(r.relation));
    }
    public getLabelFor(entityId: RdfQName): Readonly<IEntityLabel> | undefined {
        if (!this.labels) { return undefined; }
        const rawLabel = this.labels.labels[entityId];
        if (!rawLabel) { return undefined; }
        const [label, description] = rawLabel;
        return { label, description };
    }
    public lookupEntity(keyword: string, limit: number): IEntityLookupResultItem[] {
        if (limit < 0) throw new RangeError("Invalid limit value.");
        if (!this.entityLookup || !keyword || !limit) return [];
        const nonWordRegex = /[^\p{L}\p{Nd}]/ug;
        let regExCandidates: [RegExp, number][] = [
            [new RegExp("^" + keyword.replace(nonWordRegex, "\\W+"), "u"), 27],
            [new RegExp("^" + keyword.replace(nonWordRegex, "\\W+"), "ui"), 26],
            [new RegExp("^" + keyword.replace(nonWordRegex, "\\W*"), "u"), 25],
            [new RegExp("^" + keyword.replace(nonWordRegex, "\\W*"), "ui"), 24],
            [new RegExp(keyword.replace(nonWordRegex, "\\W+"), "u"), 23],
            [new RegExp(keyword.replace(nonWordRegex, "\\W+"), "ui"), 22],
            [new RegExp(keyword.replace(nonWordRegex, "\\W*"), "u"), 21],
            [new RegExp(keyword.replace(nonWordRegex, "\\W*"), "ui"), 20]
        ];
        // Prevent using expressions like "\W*" or "\W+"
        regExCandidates = regExCandidates.filter(([re]) => !(" ".match(re)));
        if (regExCandidates.length === 0) return [];
        const entityResultMap = new Map<string, IEntityLookupResultItem>();
        let currentLowestScore = 0;
        for (const [kw, kwEntries] of this.entityLookup.entries) {
            let [match, matchPriority] = wu(regExCandidates)
                .map(([re, pri]) => [re.exec(kw), pri] as [RegExpExecArray | null, number])
                .find(([re]) => !!re) || [undefined, 0];
            if (!match) continue;
            for (const [qName, language, priority] of kwEntries) {
                let languageSimilarity = evaluateLanguageSimilarity(this._language, language);
                let score = matchPriority * 10 + languageSimilarity * 5 + priority;
                if (entityResultMap.size === 0) {
                    currentLowestScore = score;
                } else if (entityResultMap.size >= limit && score < currentLowestScore) {
                    continue;
                } else {
                    currentLowestScore = Math.min(currentLowestScore, score);
                }
                const prevItem = entityResultMap.get(qName);
                // Make sure every entity only shows once in the result.
                if (prevItem && prevItem.score > score) continue;
                entityResultMap.set(qName, { qName, score, keyword: kw, keywordMatchRange: [match.index, match[0].length] });
            }
        }
        const results = Array.from(entityResultMap.values());
        // Sort descending
        results.sort((a, b) => a.score > b.score ? -1 : a.score < b.score ? 1 : 0);
        return results.slice(0, limit);
    }
    private async _fetchJsonData<T extends {} | []>(localName: string, cancellationToken?: ICancellationToken): Promise<T> {
        const result = await sendRequest({
            url: this._dataPathPrefix + localName,
            method: "GET",
            responseType: "json"
        }, cancellationToken);
        result.ensureSuccessfulStatusCode();
        return result.xhr.response;
    }
    private async _initialize(): Promise<void> {
        this._switchLanguageCts = new CancellationTokenSource();
        const slPromise = this._switchLanguage(this._language, this._switchLanguageCts.token);
        const relations = this._fetchJsonData<IRelationsRoot>("relations.json");
        const entityLookup = this._fetchJsonData<IEntityLookupRoot>("entityLookup.json");
        this.relations = await relations;
        this.entityLookup = await entityLookup;
        await slPromise;
        this._isInitialized = true;
    }
    private async _switchLanguage(language: string, cancellationToken?: ICancellationToken): Promise<void> {
        const labels = this._fetchJsonData<ILabelsRoot>("labels." + language + ".json", cancellationToken);
        this.labels = await labels;
        this._languageChanged.raise();
    }
}
