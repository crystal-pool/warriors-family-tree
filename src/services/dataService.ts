import { CancellationTokenSource, ICancellationToken, sendRequest } from "tasklike-promise-library";

export type RdfReducedUri = string;

export type CharacterRelationType = "parent" | "child" | "foster-parent" | "foster-child" | "mate" | "mentor" | "apprentice";

export interface ICharacterRelationEntry {
    subject: RdfReducedUri;
    relation: CharacterRelationType;
    target: RdfReducedUri;
    since?: RdfReducedUri;
    until?: RdfReducedUri;
    cause?: RdfReducedUri;
    reliability?: RdfReducedUri;
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

export class DataService {
    public readonly initialization: PromiseLike<void>;
    private _isInitialized = false;
    private relations: IRelationsRoot | undefined;
    private labels: ILabelsRoot | undefined;
    private _language: string;
    private _switchLanguageCts: CancellationTokenSource | undefined;
    constructor(private _dataPathPrefix: string, language?: string) {
        this._language = language && language.toLowerCase() || "en-us";
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
    public getRelationsFor(characterEntityId: RdfReducedUri, relationType?: CharacterRelationType): ICharacterRelationEntry[] | undefined {
        if (!this.relations) { return undefined; }
        const relations = this.relations.relations[characterEntityId];
        if (!relations) { return undefined; }
        return relationType ? relations.filter(r => r.relation === relationType) : relations;
    }
    public getLabelFor(entityId: RdfReducedUri): IEntityLabel | undefined {
        if (!this.labels) { return undefined; }
        const rawLabel = this.labels.labels[entityId];
        if (!rawLabel) { return undefined; }
        const [label, description] = rawLabel;
        return { label, description };
    }
    private async _initialize(): Promise<void> {
        this._switchLanguageCts = new CancellationTokenSource();
        const slPromise = this._switchLanguage(this._language, this._switchLanguageCts.token);
        const relations = await sendRequest({
            url: this._dataPathPrefix + "relations.json",
            method: "GET",
            responseType: "json"
        });
        relations.ensureSuccessfulStatusCode();
        this.relations = relations.xhr.response;
        await slPromise;
        this._isInitialized = true;
    }
    private async _switchLanguage(language: string, cancellationToken?: ICancellationToken): Promise<void> {
        const labels = await sendRequest({
            url: this._dataPathPrefix + "labels." + language + ".json",
            method: "GET",
            responseType: "json"
        }, cancellationToken);
        labels.ensureSuccessfulStatusCode();
        this.labels = labels.xhr.response;
    }
}
