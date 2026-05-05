import { Button, ListItemText, MenuItem, Tooltip } from "@mui/material";
import * as Icons from "@mui/icons-material";
import * as React from "react";
import { resourceManager } from "../localization";
import { KnownLanguage, knownLanguages, languageInfo } from "../localization/languages";
import { buildFeatureAnchorProps, buildUiScopeProps } from "../utility/featureUsage";
import { LogicallyParentedMenu } from "./mui";

export type LanguageSwitchClassName = "root" | "buttonText";

interface ILanguageSwitchProps {
    classes?: Partial<Record<LanguageSwitchClassName, string>>;
    language: KnownLanguage;
    onLanguageChanged: (language: KnownLanguage) => void;
}

export const LanguageSwitch: React.FC<ILanguageSwitchProps> = (props) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | undefined>();
    return (<React.Fragment>
        <Tooltip
            className={props.classes?.root}
            aria-label={resourceManager.getPrompt("SwitchLanguage")}
            title={resourceManager.getPrompt("SwitchLanguage")}
        >
            <Button
                color="inherit"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                {...buildFeatureAnchorProps("app.selectLanguage.toggle")}
                {...buildUiScopeProps("selectLanguage")}
            ><Icons.Translate /><span className={props.classes?.buttonText} style={{ marginLeft: 8 }}>{languageInfo[props.language].autonym}</span></Button>
        </Tooltip>
        <LogicallyParentedMenu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(undefined)}
        >
            {knownLanguages.map(lang => (
                <MenuItem
                    key={lang}
                    lang={lang}
                    selected={lang === props.language}
                    onClick={() => {
                        setAnchorEl(undefined);
                        props.onLanguageChanged(lang);
                    }}
                    {...buildFeatureAnchorProps("app.selectLanguage.item", { lang })}
                >
                    <ListItemText primary={languageInfo[lang].autonym} />
                </MenuItem>
            ))}
        </LogicallyParentedMenu>
    </React.Fragment>);
};
