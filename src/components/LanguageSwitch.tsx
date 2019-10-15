import { Button, createStyles, ListItemText, makeStyles, Menu, MenuItem, Theme, Tooltip } from "@material-ui/core";
import * as Icons from "@material-ui/icons";
import * as React from "react";
import { resourceManager } from "../localization";
import { KnownLanguage, knownLanguages, languageInfo } from "../localization/languages";

export type LanguageSwitchClassName = "root" | "buttonText";

interface ILanguageSwitchProps {
    classes?: Partial<Record<LanguageSwitchClassName, string>>;
    language: KnownLanguage;
    onLanguageChanged: (language: KnownLanguage) => void;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles<LanguageSwitchClassName, ILanguageSwitchProps>({
        root: {},
        buttonText: {
            marginLeft: theme.spacing(1)
        }
    }));

export const LanguageSwitch: React.FC<ILanguageSwitchProps> = (props) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | undefined>();
    const classes = useStyles(props);
    return (<React.Fragment>
        <Tooltip
            className={classes.root}
            aria-label={resourceManager.getPrompt('SwitchLanguage')}
            title={resourceManager.getPrompt('SwitchLanguage')}
        >
            <Button
                color="inherit"
                onClick={(e) => setAnchorEl(e.currentTarget)}
            ><Icons.Translate /><span className={classes.buttonText}>{languageInfo[props.language].autonym}</span></Button>
        </Tooltip>
        <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={!!anchorEl}
            onClose={() => setAnchorEl(undefined)}
        >
            {knownLanguages.map(lang => (
                <MenuItem key={lang} selected={lang === props.language} onClick={() => {
                    setAnchorEl(undefined);
                    props.onLanguageChanged(lang);
                }}>
                    <ListItemText primary={languageInfo[lang].autonym} />
                </MenuItem>
            ))}
        </Menu>
    </React.Fragment>)
};
