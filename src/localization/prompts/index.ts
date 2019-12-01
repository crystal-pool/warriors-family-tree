import { KnownLanguageWithFallback } from "../languages";
import cs from "./cs";
import de from "./de";
import en, { PromptsTable } from "./en";
import es from "./es";
import fi from "./fi";
import fr from "./fr";
import it from "./it";
import ja_jp from "./ja-jp";
import ko_kr from "./ko-kr";
import lt from "./lt";
import nl from "./nl";
import pl from "./pl";
import ru from "./ru";
import uk from "./uk";
import zh_cn from "./zh-cn";
import zh_tw from "./zh-tw";

const resourceTable: Partial<Record<KnownLanguageWithFallback, Partial<PromptsTable>>> = {
    cs,
    de,
    en,
    es,
    fi,
    fr,
    it,
    "ja-jp": ja_jp,
    "ko-kr": ko_kr,
    lt,
    nl,
    pl,
    ru,
    uk,
    "zh-cn": zh_cn,
    "zh-tw": zh_tw,
};

export { PromptKey } from "./en";

export default resourceTable;
