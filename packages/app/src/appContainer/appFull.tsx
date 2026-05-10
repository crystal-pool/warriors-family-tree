import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, Link, SwipeableDrawer, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import * as Icons from "@mui/icons-material";
import * as React from "react";
import { AppActionsList, EnvironmentInfoList } from "../components/DrawerActions";
import { EntitySearchBox } from "../components/EntitySearchBox";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { LanguageContext } from "../localization/react";
import { InitializationScreen, routePathBuilders } from "../pages";
import { buildFeatureAnchorProps, buildUiScopeProps } from "../utility/featureUsage";
import { RoutesAfterInitialization } from "./routes";

const drawerWidth = 240;

export const AppFull: React.FC = () => {
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const languageContext = React.useContext(LanguageContext);

    function handleDrawerToggle() {
        setMobileOpen(!mobileOpen);
    }

    const drawer = (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }} {...buildUiScopeProps("drawer")}>
            <Box sx={theme.mixins.toolbar} />
            <Divider />
            <AppActionsList />
            <Divider />
            <Box sx={{ flexGrow: 1, minHeight: "1em" }} />
            <EnvironmentInfoList />
        </Box>
    );

    return (
        <Box sx={{ display: "flex" }} {...buildUiScopeProps("app")}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ ml: `${drawerWidth}px`, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
                <Toolbar {...buildUiScopeProps("toolbar")}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: "none" } }}
                        {...buildFeatureAnchorProps("app.toggleDrawer")}
                    >
                        <Icons.Menu />
                    </IconButton>
                    <Link
                        href={routePathBuilders.welcome()}
                        sx={{ flexGrow: 1, display: { xs: "none", sm: "block" }, color: "inherit" }}
                        {...buildFeatureAnchorProps("navigation.home")}
                    >
                        <Typography variant="h6" noWrap>Warriors Family Tree</Typography>
                    </Link>
                    <Box sx={{
                        display: "flex", flexDirection: "row", alignItems: "center",
                        flexGrow: { xs: 1, sm: 0 }
                    }}>
                        <EntitySearchBox
                            onAccept={(qName) => {
                                location.href = routePathBuilders.entityProfile({ qName });
                            }}
                        />
                        <LanguageSwitch classes={{ buttonText: undefined }}
                            language={languageContext.language} onLanguageChanged={languageContext.setLanguage} />
                    </Box>
                </Toolbar>
            </AppBar>
            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="siderbar actions">
                {!isMdUp && (
                    <SwipeableDrawer
                        variant="temporary"
                        anchor={theme.direction === "rtl" ? "right" : "left"}
                        open={mobileOpen}
                        onOpen={handleDrawerToggle}
                        onClose={handleDrawerToggle}
                        sx={{ "& .MuiDrawer-paper": { width: drawerWidth } }}
                        ModalProps={{ keepMounted: true }}
                        {...buildUiScopeProps("app/toolbar/popupDrawer")}
                    >
                        {drawer}
                    </SwipeableDrawer>
                )}
                {isMdUp && (
                    <Drawer
                        variant="permanent"
                        open
                        sx={{ "& .MuiDrawer-paper": { width: drawerWidth } }}
                    >
                        {drawer}
                    </Drawer>
                )}
            </Box>
            <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
                <Box sx={theme.mixins.toolbar} />
                <React.Suspense fallback={<InitializationScreen />}>
                    <RoutesAfterInitialization />
                </React.Suspense>
            </Box>
        </Box>
    );
};
