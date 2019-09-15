import { AppBar, CssBaseline, Divider, Drawer, Hidden, IconButton, List, ListItem, ListItemIcon, ListItemText, makeStyles, SwipeableDrawer, Toolbar, Typography, useTheme } from '@material-ui/core';
import * as Icons from '@material-ui/icons';
import * as React from 'react';
import { Route } from 'react-router';
import { HashRouter } from 'react-router-dom';
import { AppModel } from './appModel';
import * as Pages from './pages';

export interface IAppProps {
    model: AppModel;
}

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
    },
    drawer: {
        [theme.breakpoints.up('sm')]: {
            width: drawerWidth,
            flexShrink: 0,
        },
    },
    appBar: {
        marginLeft: drawerWidth,
        [theme.breakpoints.up('sm')]: {
            width: `calc(100% - ${drawerWidth}px)`,
        },
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            display: 'none',
        },
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
        width: drawerWidth,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
}));

export const App: React.FC<IAppProps> = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = React.useState(false);

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
                            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
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
                    <Route exact path="/" component={Pages.Welcome} />
                    <Route path="/familyTree" component={Pages.FamilyTree} />
                </main>
            </HashRouter>
        </div>
    );
};
