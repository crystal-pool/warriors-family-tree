import { KnownLanguageWithFallback } from "../languages";
import en, { PromptsTable } from "./en";
import zh_cn from "./zh-cn";
import zh_tw from "./zh-tw";

const resourceTable: Partial<Record<KnownLanguageWithFallback, Partial<PromptsTable>>> = {
    en,
    "zh-cn": zh_cn,
    "zh-tw": zh_tw
};

export { PromptKey } from "./en";

export default resourceTable;
