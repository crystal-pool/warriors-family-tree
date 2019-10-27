import { AppBar, CssBaseline, Divider, Drawer, Hidden, IconButton, Link, List, ListItem, ListItemIcon, ListItemText, makeStyles, Snackbar, SwipeableDrawer, Toolbar, Tooltip, Typography, useTheme } from "@material-ui/core";
import { createMuiTheme, fade } from "@material-ui/core/styles";
import * as Icons from "@material-ui/icons";
import { ThemeProvider } from "@material-ui/styles";
import * as React from "react";
import { EntitySearchBox } from "../components/EntitySearchBox";
import { LanguageSwitch } from "../components/LanguageSwitch";
import { resourceManager } from "../localization";
import { LanguageContext } from "../localization/react";
import { InitializationScreen, routePathBuilders } from "../pages";
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

function openUrl(url: string): void {
    window.open(url, "_blank");
}

const environmentInfoListTheme = createMuiTheme({
    typography: {
        fontSize: 12,
    }
});

const EnvironmentInfoList: React.FC = () => {
    return (<ThemeProvider theme={environmentInfoListTheme}>
        <List dense>
            {!environment.isProduction && <ListItem><ListItemText primary="Development Mode" /></ListItem>}
            <Tooltip title="Go to the source code of this revision.">
                <ListItem button
                    onClick={() => openUrl("https://github.com/crystal-pool/warriors-family-tree/commit/" + environment.commitId)} >
                    <ListItemText primary="Revision" secondary={environment.commitId.substr(0, 8)} />
                </ListItem>
            </Tooltip>
            <ListItem>
                <ListItemText primary="Build time" secondary={new Date(environment.buildTimestamp).toISOString()} />
            </ListItem>
        </List >
    </ThemeProvider>);
};

export const AppFull: React.FC = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [error, setError] = React.useState<Error>();
    const languageContext = React.useContext(LanguageContext);
    const errorMessage = error && (error.stack || error.message || error.toString());

    React.useEffect(() => {
        function onGlobalError(e: ErrorEvent | PromiseRejectionEvent) {
            const merged = e as (ErrorEvent & PromiseRejectionEvent);
            setError(merged.error || merged.reason || "<Error>");
        }
        window.addEventListener("error", onGlobalError);
        window.addEventListener("unhandledrejection", onGlobalError);
        return () => {
            window.removeEventListener("error", onGlobalError);
            window.removeEventListener("unhandledrejection", onGlobalError);
        };
    });

    function handleDrawerToggle() {
        setMobileOpen(!mobileOpen);
    }

    const drawer = (
        <div className={classes.drawerContent}>
            <div className={classes.toolbar} />
            <Divider />
            <List>
                <ListItem button onClick={() => openUrl("https://github.com/crystal-pool/warriors-family-tree")}>
                    <ListItemIcon><Icons.Code /></ListItemIcon>
                    <ListItemText primary="GitHub" secondary={resourceManager.getPrompt("StarTheRepo")} />
                </ListItem>
                <ListItem button onClick={() => openUrl("https://crystalpool.cxuesong.com/")}>
                    <ListItemIcon><Icons.Storage /></ListItemIcon>
                    <ListItemText primary="Crystal Pool" secondary={resourceManager.getPrompt("ContributeToTheDataSource")} />
                </ListItem>
            </List>
            <Divider />
            <div className={classes.drawerSpacing} />
            <EnvironmentInfoList />
        </div>
    );

    return (
        <div className={classes.root}>
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
                                location.href = routePathBuilders.familyTree({ character: qName });
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
            <Snackbar open={!!error} message={<div style={{ whiteSpace: "pre-wrap" }}>{errorMessage}</div>} />
        </div>
    );
};
