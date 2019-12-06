import { Button, createStyles, Divider, Hidden, IconButton, ListItemText, makeStyles, Tooltip, Typography } from "@material-ui/core";
import * as Icons from "@material-ui/icons";
import * as React from "react";
import { useLocation } from "react-router";
import { resourceManager } from "../localization";
import { LanguageContext } from "../localization/react";
import { buildRoutePath } from "../pages";
import { buildFeatureAnchorProps, buildUiScopeProps } from "../utility/featureUsage";
import { setQueryParams } from "../utility/queryParams";
import { AppActionsList, EnvironmentInfoList } from "./DrawerActions";
import { LanguageSwitch } from "./LanguageSwitch";
import { LogicallyParentedMenu } from "./mui";

export type EmbedAppBarClassName = "root" | "title" | "toolbar" | "languageSwitchButtonText";

interface IEmbedAppBarProps {
    classes?: Partial<Record<EmbedAppBarClassName, string>>;
    title?: React.ReactNode;
}

const useStyles = makeStyles(theme => createStyles<EmbedAppBarClassName, IEmbedAppBarProps>({
    root: {
        [theme.breakpoints.up("sm")]: {
            display: "flex",
            flexDirection: "row"
        }
    },
    title: {
        flexGrow: 1,
        display: "flex",
        flexDirection: "row",
        alignItems: "center"
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
        <div className={classes.title}>{props.title ? (<Typography variant="h6" noWrap>{props.title}</Typography>) : props.children}</div>
        <div className={classes.toolbar} {...buildUiScopeProps("toolbar")}>
            <Tooltip title={resourceManager.getPrompt("OpenInNewWindow")}>
                <IconButton
                    onClick={onOpenInNewWindowClicked}
                    {...buildFeatureAnchorProps("navigation.openFull")}
                ><Icons.OpenInNew /></IconButton>
            </Tooltip>
            <LanguageSwitch classes={{ buttonText: classes.languageSwitchButtonText }}
                language={languageContext.language} onLanguageChanged={languageContext.setLanguage} />
            <Tooltip title={<ListItemText
                primary={resourceManager.renderPrompt("EmbedPoweredBy1", [<span key={1} style={{ fontVariant: "small-caps" }}>Warriors Family Tree</span>])}
                secondary={resourceManager.getPrompt("EmbedAppMenu")} />}
            >
                <Button
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    {...buildFeatureAnchorProps("app.toggleDrawer")}
                    {...buildUiScopeProps("popupDrawer")}
                ><Hidden xsDown>Warriors Family Tree</Hidden><Hidden smUp>WFT</Hidden><Icons.MoreVert /></Button>
            </Tooltip>
        </div>
        <LogicallyParentedMenu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={onCloseMenu}
        >
            <AppActionsList asMenuItem onItemClick={onCloseMenu} />
            <Divider />
            <EnvironmentInfoList asMenuItem onItemClick={onCloseMenu} />
        </LogicallyParentedMenu>
    </div>);
};
