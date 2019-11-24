import _ from "lodash";

export interface ILanguageInfo {
    autonym: string;
}

const knownLanguagesInfo = {
    "cs": <ILanguageInfo>{ autonym: "čeština" },
    "de": { autonym: "Deutsch" },
    "en-us": { autonym: "English (United States)" },
    "en-gb": { autonym: "English (United Kingdom)" },
    "es": { autonym: "español" },
    "fi": { autonym: "suomi" },
    "fr": { autonym: "français" },
    "it": { autonym: "italiano" },
    "ja-jp": { autonym: "日本語 (日本)" },
    "ko-kr": { autonym: "한국어(대한민국)" },
    "lt": { autonym: "lietuvių" },
    "nl": { autonym: "Nederlands" },
    "pl": { autonym: "polski" },
    "ru": { autonym: "русский" },
    "uk": { autonym: "українська" },
    "zh-cn": { autonym: "中文(中国)" },
    "zh-tw": { autonym: "中文(台灣)" },
};

export type KnownLanguage = keyof typeof knownLanguagesInfo;

export type KnownLanguageWithFallback = keyof typeof knownLanguagesInfo | "en" | "zh";

export const knownLanguages: ReadonlyArray<KnownLanguage> = Object
    .keys(knownLanguagesInfo)
    .filter((k): k is KnownLanguage => Object.prototype.hasOwnProperty.call(knownLanguagesInfo, k))
    .sort();

export const languageInfo: Readonly<Record<KnownLanguage, ILanguageInfo>> = knownLanguagesInfo;

export function fallbackLanguageTag(language: string): string {
    const lastSeparatorPos = language.lastIndexOf("-");
    if (lastSeparatorPos < 0) return "";
    return language.substr(0, lastSeparatorPos);
}

export function evaluateLanguageSimilarity(baseline: string, target: string): number {
    baseline = baseline.toLowerCase();
    target = target.toLowerCase();
    if (baseline === target) return 1;
    // zh, zh-cn
    if (target.startsWith(baseline)) return 1;
    const baselineParts = baseline.split("-");
    const targetParts = target.split("-");
    let commonParts = 0;
    for (; baselineParts[commonParts] && targetParts[commonParts]; commonParts++) {
        if (baselineParts[commonParts] !== targetParts[commonParts]) break;
    }
    return Math.min(1, commonParts / baselineParts.length);
}

export function choosePerferredLanguage<TBaseline extends string>(baselines: Iterable<TBaseline>, preferences: string | readonly string[]): TBaseline | undefined {
    if (!preferences || preferences.length === 0) return undefined;
    if (typeof preferences === "string") preferences = [preferences];
    let priority = preferences.length;
    const languageCandidates = new Map<TBaseline, number>();
    for (let lang of preferences) {
        for (const knownLang of baselines) {
            const similarity = evaluateLanguageSimilarity(knownLang, lang);
            languageCandidates.set(knownLang, Math.max(languageCandidates.get(knownLang) || 0, similarity * priority));
        }
        priority--;
    }
    return Array.from(languageCandidates).sort(([, p1], [, p2]) => p2 - p1)[0][0];
}

function detectBrowserLanguage(): KnownLanguage {
    return choosePerferredLanguage(knownLanguages, _.uniq(navigator.languages || navigator.language || "en-us")) || "en-us";
}

export const browserLanguage = detectBrowserLanguage();

export function selectLocalizedResource<T>(resourceProvider: (language: string) => T | undefined, language: string, defaultValue: T): T;
export function selectLocalizedResource<T>(resourceProvider: (language: string) => T | undefined, language: string): T | undefined;
export function selectLocalizedResource<T>(resourceProvider: (language: string) => T | undefined, language: string, defaultValue?: T): T | undefined {
    let lang = language;
    while (lang) {
        const value = resourceProvider(lang);
        if (value !== undefined) return value;
        if (lang === "en") {
            break;
        }
        lang = fallbackLanguageTag(lang) || "en";
    }
    return defaultValue;
}
