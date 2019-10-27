import { createMuiTheme, List, ListItem, ListItemIcon, ListItemText, MenuItem, Tooltip } from "@material-ui/core";
import * as Icons from "@material-ui/icons";
import { ThemeProvider } from "@material-ui/styles";
import React from "react";
import { resourceManager } from "../localization";

const environmentInfoListTheme = createMuiTheme({
    typography: {
        fontSize: 12,
    }
});

function openUrl(url: string): void {
    window.open(url, "_blank");
}

interface IItemComponentProps {
    asMenuItem?: boolean;
    onClick?: () => void;
    href?: string;
}

export interface IDrawerActionsProps {
    asMenuItem?: boolean;
    onItemClick?: () => void;
}

const ItemComponent: React.FC<IItemComponentProps> = (props) => {
    if (props.asMenuItem) {
        return (<MenuItem {...props}>{props.children}</MenuItem>);
    } else if (props.onClick || props.href) {
        return (<ListItem button {...props}>{props.children}</ListItem>);
    } else {
        return (<ListItem {...props}>{props.children}</ListItem>);
    }
};

export const AppActionsList: React.FC<IDrawerActionsProps> = React.memo((props) => {
    return (
        <List>
            <ItemComponent onClick={() => {
                openUrl("https://github.com/crystal-pool/warriors-family-tree");
                props.onItemClick && props.onItemClick();
            }}>
                <ListItemIcon><Icons.Code /></ListItemIcon>
                <ListItemText primary="GitHub" secondary={resourceManager.getPrompt("StarTheRepo")} />
            </ItemComponent>
            <ItemComponent onClick={() => {
                openUrl("https://crystalpool.cxuesong.com/");
                props.onItemClick && props.onItemClick();
            }}>
                <ListItemIcon><Icons.Storage /></ListItemIcon>
                <ListItemText primary="Crystal Pool" secondary={resourceManager.getPrompt("ContributeToTheDataSource")} />
            </ItemComponent>
        </List>);
});

export const EnvironmentInfoList: React.FC<IDrawerActionsProps> = React.memo((props) => {
    return (<ThemeProvider theme={environmentInfoListTheme}>
        <List dense>
            {!environment.isProduction && <ListItem><ListItemText primary="Development Mode" /></ListItem>}
            <Tooltip title="Go to the source code of this revision.">
                <ItemComponent
                    onClick={() => {
                        openUrl("https://github.com/crystal-pool/warriors-family-tree/commit/" + environment.commitId);
                        props.onItemClick && props.onItemClick();
                    }} >
                    <ListItemText primary="Revision" secondary={environment.commitId.substr(0, 8)} />
                </ItemComponent>
            </Tooltip>
            <ItemComponent>
                <ListItemText primary="Build time" secondary={new Date(environment.buildTimestamp).toISOString()} />
            </ItemComponent>
        </List >
    </ThemeProvider>);
});
