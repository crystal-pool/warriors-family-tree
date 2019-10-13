import { ReactNode } from "react";
import { browserLanguage, KnownLanguage, KnownLanguageWithFallback, selectLocalizedResource } from "./languages";
import prompts from "./prompts";
import { PromptKey } from "./prompts/en";
import { formatTemplate, renderTemplate, TemplateArguments } from "./render";

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
    public getPrompt(key: PromptKey, args?: TemplateArguments<string>): string {
        let value = selectLocalizedResource(lang => prompts[lang as KnownLanguageWithFallback] && prompts[lang as KnownLanguageWithFallback]![key], this._language, key);
        if (args) value = formatTemplate(value, args);
        return value;
    }
    public renderPrompt(key: PromptKey, args: TemplateArguments<ReactNode>): ReactNode {
        const prompt = this.getPrompt(key);
        return renderTemplate(prompt, args);
    }
}