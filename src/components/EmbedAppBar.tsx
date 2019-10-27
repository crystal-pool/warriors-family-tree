import { Button, createStyles, Divider, IconButton, ListItemText, makeStyles, Menu, Tooltip } from "@material-ui/core";
import * as Icons from "@material-ui/icons";
import * as React from "react";
import { useLocation } from "react-router";
import { LanguageContext } from "../localization/react";
import { buildRoutePath } from "../pages";
import { setQueryParams } from "../utility/queryParams";
import { AppActionsList, EnvironmentInfoList } from "./DrawerActions";
import { LanguageSwitch } from "./LanguageSwitch";

export type EmbedAppBarClassName = "root" | "title" | "toolbar" | "languageSwitchButtonText";

interface IEmbedAppBarProps {
    classes?: Partial<Record<EmbedAppBarClassName, string>>;
}

const useStyles = makeStyles(theme => createStyles<EmbedAppBarClassName, IEmbedAppBarProps>({
    root: {
        display: "flex",
        flexDirection: "row"
    },
    title: {
        flexGrow: 1
    },
    toolbar: {
    },
    languageSwitchButtonText: {
        display: "none"
    }
}));

function openUrl(url: string): void {
    window.open(url, "_blank");
}

export const EmbedAppBar: React.FC<IEmbedAppBarProps> = (props) => {
    const classes = useStyles(props);
    const languageContext = React.useContext(LanguageContext);
    const loc = useLocation();
    const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | undefined>();
    const onOpenInNewWindowClicked = React.useCallback(() => {
        const newUrl = buildRoutePath(loc.pathname, loc.search && setQueryParams(loc.search, { embed: null, pmToken: null }));
        openUrl(newUrl);
    }, [loc.pathname, loc.search]);
    const onCloseMenu = React.useCallback(() => setMenuAnchor(undefined), []);
    return (<div className={classes.root}>
        <div className={classes.title}>{props.children}</div>
        <div className={classes.toolbar}>
            <Tooltip title="Open in new window">
                <IconButton onClick={onOpenInNewWindowClicked}><Icons.OpenInNew /></IconButton>
            </Tooltip>
            <LanguageSwitch classes={{ buttonText: classes.languageSwitchButtonText }}
                language={languageContext.language} onLanguageChanged={languageContext.setLanguage} />
            <Tooltip title={<ListItemText primary="Powered by Warriors Family Tree" secondary="Click to see more information" />}>
                <Button onClick={(e) => setMenuAnchor(e.currentTarget)}>Warriors Family Tree<Icons.MoreVert /></Button>
            </Tooltip>
        </div>
        <Menu
            anchorEl={menuAnchor}
            keepMounted
            open={!!menuAnchor}
            onClose={onCloseMenu}
        >
            <AppActionsList asMenuItem onItemClick={onCloseMenu} />
            <Divider />
            <EnvironmentInfoList asMenuItem onItemClick={onCloseMenu} />
        </Menu>
    </div>);
};
