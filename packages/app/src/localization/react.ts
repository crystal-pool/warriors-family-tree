import * as React from "react";
import { browserLanguage, KnownLanguage } from "./languages";

export interface ILanguageContextValue {
    language: KnownLanguage;
    setLanguage: (language: KnownLanguage) => void;
}

export const LanguageContext = React.createContext<ILanguageContextValue>({
    language: browserLanguage,
    setLanguage(language) {
        throw new Error("Not supported.");
    }
});
LanguageContext.displayName = "LanguageContext";

export function useLanguage(): KnownLanguage {
    return React.useContext(LanguageContext).language;
}
