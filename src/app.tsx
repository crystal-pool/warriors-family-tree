import { AppBar, CssBaseline, Divider, Drawer, Hidden, IconButton, List, ListItem, ListItemIcon, ListItemText, makeStyles, Snackbar, SwipeableDrawer, Toolbar, Typography, useTheme } from "@material-ui/core";
import * as Icons from "@material-ui/icons";
import * as React from "react";
import { Route } from "react-router";
import { HashRouter } from "react-router-dom";
import { PromiseLikeResolutionSource } from "tasklike-promise-library";
import * as Pages from "./pages";
import { dataService } from "./services";

export interface IAppProps {
}

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex",
    },
    drawer: {
        [theme.breakpoints.up("sm")]: {
            width: drawerWidth,
            flexShrink: 0,
        },
    },
    appBar: {
        marginLeft: drawerWidth,
        [theme.breakpoints.up("sm")]: {
            width: `calc(100% - ${drawerWidth}px)`,
        },
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up("sm")]: {
            display: "none",
        },
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
        width: drawerWidth,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
        minWidth: 0
    },
}));

export const App: React.FC<IAppProps> = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [dataInitialized, setDataInitialized] = React.useState(dataService.isInitialized);
    const [error, setError] = React.useState<Error>();
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

    React.useEffect(() => {
        if (dataInitialized) { return; }
        const cleanupPrs = new PromiseLikeResolutionSource();
        Promise.race([cleanupPrs.promiseLike, dataService.initialization])
            .then(p => cleanupPrs && cleanupPrs.tryResolve() && setDataInitialized(true));
        return () => { cleanupPrs.tryResolve(); };
    });

    function handleDrawerToggle() {
        setMobileOpen(!mobileOpen);
    }

    const drawer = (
        <div>
            <div className={classes.toolbar} />
            <Divider />
            <List>
                <ListItem button>
                    <ListItemIcon><Icons.Info /></ListItemIcon>
                    <ListItemText primary="Item1" />
                </ListItem>
                <ListItem button>
                    <ListItemIcon><Icons.Info /></ListItemIcon>
                    <ListItemText primary="Item2" />
                </ListItem>
            </List>
            <Divider />
        </div>
    );

    return (
        <div className={classes.root}>
            <CssBaseline />
            <HashRouter>
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
                        <Typography variant="h6" noWrap>Warriors Family Tree</Typography>
                    </Toolbar>
                </AppBar>
                <nav className={classes.drawer} aria-label="siderbar actions">
                    {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
                    <Hidden smUp implementation="css">
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
                    <Hidden xsDown implementation="css">
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
                    {
                        dataInitialized
                            ? <React.Fragment>
                                <Route exact path={Pages.routePaths.welcome} component={Pages.Welcome} />
                                <Route path={Pages.routePaths.familyTree} component={Pages.FamilyTree} />
                            </React.Fragment>
                            : <Pages.InitializationScreen />
                    }

                </main>
            </HashRouter>
            <Snackbar open={!!error} message={<div style={{ whiteSpace: "pre-wrap" }}>{errorMessage}</div>} />
        </div>
    );
};
