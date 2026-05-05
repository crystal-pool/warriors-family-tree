import { Box, Button, Divider, IconButton, ListItemText, Tooltip, Typography } from "@mui/material";
import * as Icons from "@mui/icons-material";
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
    children?: React.ReactNode;
}

function openUrl(url: string): void {
    window.open(url, "_blank");
}

export const EmbedAppBar: React.FC<IEmbedAppBarProps> = (props) => {
    const languageContext = React.useContext(LanguageContext);
    const loc = useLocation();
    const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | undefined>();
    const onOpenInNewWindowClicked = React.useCallback(() => {
        const newUrl = buildRoutePath(loc.pathname, loc.search && setQueryParams(loc.search, { embed: null, pmToken: null }));
        openUrl(newUrl);
    }, [loc.pathname, loc.search]);
    const onCloseMenu = React.useCallback(() => setMenuAnchor(undefined), []);
    return (<Box className={props.classes?.root} sx={{ display: { sm: "flex" }, flexDirection: { sm: "row" } }}>
        <div className={props.classes?.title} style={{ flexGrow: 1, display: "flex", flexDirection: "row", alignItems: "center" }} {...buildUiScopeProps("title")}>
            {props.title ? (<Typography variant="h6" noWrap>{props.title}</Typography>) : props.children}
        </div>
        <div className={props.classes?.toolbar} {...buildUiScopeProps("toolbar")}>
            <Tooltip title={resourceManager.getPrompt("OpenInNewWindow")}>
                <IconButton
                    onClick={onOpenInNewWindowClicked}
                    {...buildFeatureAnchorProps("navigation.openFull")}
                ><Icons.OpenInNew /></IconButton>
            </Tooltip>
            <LanguageSwitch classes={{ buttonText: props.classes?.languageSwitchButtonText ?? "" }}
                language={languageContext.language} onLanguageChanged={languageContext.setLanguage} />
            <Tooltip title={<ListItemText
                primary={resourceManager.renderPrompt("EmbedPoweredBy1", [<span key={1} style={{ fontVariant: "small-caps" }}>Warriors Family Tree</span>])}
                secondary={resourceManager.getPrompt("EmbedAppMenu")} />}
            >
                <Button
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    {...buildFeatureAnchorProps("app.toggleDrawer")}
                    {...buildUiScopeProps("popupDrawer")}
                >
                    <Box sx={{ display: { xs: "none", sm: "inline" } }}>Warriors Family Tree</Box>
                    <Box sx={{ display: { xs: "inline", sm: "none" } }}>WFT</Box>
                    <Icons.MoreVert />
                </Button>
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
    </Box>);
};
