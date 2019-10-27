import * as React from "react";
import { browserLanguage, KnownLanguage } from "./languages";

export interface ILanguageContextProps {
    language: KnownLanguage;
    setLanguage: (language: KnownLanguage) => void;
}

export const LanguageContext = React.createContext<ILanguageContextProps>({
    language: browserLanguage,
    setLanguage(language) {
        throw new Error("Not supported.");
    }
});
LanguageContext.displayName = "LanguageContext";
