import { AppBar, CssBaseline, Divider, Drawer, Hidden, IconButton, Link, makeStyles, SwipeableDrawer, Toolbar, Typography, useTheme } from "@material-ui/core";
import { fade } from "@material-ui/core/styles";
import * as Icons from "@material-ui/icons";
import * as React from "react";
import { AppActionsList, EnvironmentInfoList } from "../components/DrawerActions";
import { EntitySearchBox } from "../components/EntitySearchBox";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { LanguageContext } from "../localization/react";
import { InitializationScreen, routePathBuilders } from "../pages";
import { buildUiScopeProps } from "../utility/featureUsage";
import { RoutesAfterInitialization } from "./routes";

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
    },
    drawer: {
        [theme.breakpoints.up("md")]: {
            width: drawerWidth,
            flexShrink: 0,
        },
    },
    drawerContent: {
        display: "flex",
        flexDirection: "column",
        height: "100%"
    },
    drawerSpacing: {
        flexGrow: 1,
        minHeight: "1em"
    },
    appBar: {
        marginLeft: drawerWidth,
        [theme.breakpoints.up("md")]: {
            width: `calc(100% - ${drawerWidth}px)`,
        },
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up("md")]: {
            display: "none",
        },
    },
    toolbar: theme.mixins.toolbar,
    title: {
        flexGrow: 1,
        display: "none",
        color: "inherit",
        [theme.breakpoints.up("sm")]: {
            display: "block",
        }
    },
    farItems: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        flexGrow: 1,
        [theme.breakpoints.up("sm")]: {
            flexGrow: 0
        }
    },
    languageSwitchButtonText: {
        [theme.breakpoints.down("sm")]: {
            display: "none",
        }
    },
    searchBoxRoot: {
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        "&:hover": {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
        marginRight: theme.spacing(2),
        width: "100%",
        [theme.breakpoints.up("sm")]: {
            marginLeft: theme.spacing(1),
            width: "auto",
        },
    },
    searchBoxInput: {
        transition: theme.transitions.create("width"),
        [theme.breakpoints.up("sm")]: {
            width: 160,
            "&:focus": {
                width: 180,
            },
        },
        [theme.breakpoints.up("md")]: {
            width: 200,
            "&:focus": {
                width: 300,
            },
        },
        [theme.breakpoints.up("lg")]: {
            "&:focus": {
                width: 400,
            },
        },
    },
    drawerPaper: {
        width: drawerWidth,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        minWidth: 0
    },
}));

export const AppFull: React.FC = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const languageContext = React.useContext(LanguageContext);

    function handleDrawerToggle() {
        setMobileOpen(!mobileOpen);
    }

    const drawer = (
        <div className={classes.drawerContent} {...buildUiScopeProps("drawer")}>
            <div className={classes.toolbar} />
            <Divider />
            <AppActionsList />
            <Divider />
            <div className={classes.drawerSpacing} />
            <EnvironmentInfoList />
        </div>
    );

    return (
        <div className={classes.root} {...buildUiScopeProps("app")}>
            <CssBaseline />
            <AppBar position="fixed" className={classes.appBar}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        className={classes.menuButton}
                    >
                        <Icons.Menu />
                    </IconButton>
                    <Link href={routePathBuilders.welcome()} className={classes.title}>
                        <Typography variant="h6" noWrap>Warriors Family Tree</Typography>
                    </Link>
                    <div className={classes.farItems}>
                        <EntitySearchBox classes={{
                            root: classes.searchBoxRoot,
                            inputInput: classes.searchBoxInput
                        }}
                            onAccept={(qName) => {
                                location.href = routePathBuilders.entityProfile({ qName });
                            }}
                        />
                        <LanguageSwitch classes={{ buttonText: classes.languageSwitchButtonText }}
                            language={languageContext.language} onLanguageChanged={languageContext.setLanguage} />
                    </div>
                </Toolbar>
            </AppBar>
            <nav className={classes.drawer} aria-label="siderbar actions">
                {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                <Hidden mdUp>
                    <SwipeableDrawer
                        container={undefined}
                        variant="temporary"
                        anchor={theme.direction === "rtl" ? "right" : "left"}
                        open={mobileOpen}
                        onOpen={handleDrawerToggle}
                        onClose={handleDrawerToggle}
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile.
                        }}
                    >
                        {drawer}
                    </SwipeableDrawer>
                </Hidden>
                <Hidden smDown>
                    <Drawer
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                        variant="permanent"
                        open
                    >
                        {drawer}
                    </Drawer>
                </Hidden>
            </nav>
            <main className={classes.content}>
                <div className={classes.toolbar} />
                <React.Suspense fallback={<InitializationScreen />}>
                    <RoutesAfterInitialization />
                </React.Suspense>
            </main>
        </div>
    );
};
