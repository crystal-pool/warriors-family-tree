import { KnownLanguage, selectLocalizedResource, KnownLanguageWithFallback, browserLanguage } from "./languages";
import { PromptKey } from "./prompts/en";
import prompts from "./prompts";

export class ResourceManager {
    private _language: KnownLanguage;
    public constructor() {
        this._language = browserLanguage;
    }
    public get language(): KnownLanguage {
        return this._language;
    }
    public set language(language: KnownLanguage) {
        this._language = language;
    }
    public getPrompt(key: PromptKey): string {
        return selectLocalizedResource(lang => prompts[lang as KnownLanguageWithFallback] && prompts[lang as KnownLanguageWithFallback]![key], this._language, key);
    }
}