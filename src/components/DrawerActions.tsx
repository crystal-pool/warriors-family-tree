import { createMuiTheme, List, ListItem, ListItemIcon, ListItemText, MenuItem, Tooltip } from "@material-ui/core";
import * as Icons from "@material-ui/icons";
import { ThemeProvider } from "@material-ui/styles";
import React from "react";
import { resourceManager } from "../localization";
import * as LocalIcons from "../utility/muiIcons";

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

// Need ref to make Tooltip work
const ItemComponent: React.FC<IItemComponentProps> = React.forwardRef((props, ref: React.Ref<any>) => {
    if (props.asMenuItem) {
        return (<MenuItem ref={ref} {...props}>{props.children}</MenuItem>);
    } else if (props.onClick || props.href) {
        return (<ListItem ref={ref} button {...props}>{props.children}</ListItem>);
    } else {
        return (<ListItem ref={ref} {...props}>{props.children}</ListItem>);
    }
});

// Need ref to make Menu work
export const AppActionsList: React.FC<IDrawerActionsProps> = React.forwardRef((props, ref: React.Ref<any>) => {
    return (
        <List ref={ref}>
            <ItemComponent onClick={() => {
                openUrl("https://github.com/crystal-pool/warriors-family-tree");
                props.onItemClick && props.onItemClick();
            }}>
                <ListItemIcon><LocalIcons.GitHub /></ListItemIcon>
                <ListItemText primary="GitHub" secondary={resourceManager.getPrompt("StarTheRepo")} />
            </ItemComponent>
            <ItemComponent onClick={() => {
                openUrl("https://crystalpool.cxuesong.com/");
                props.onItemClick && props.onItemClick();
            }}>
                <ListItemIcon><Icons.Storage /></ListItemIcon>
                <ListItemText primary="Crystal Pool" secondary={resourceManager.getPrompt("ContributeToTheDataSource")} />
            </ItemComponent>
            <ItemComponent onClick={() => {
                openUrl("https://crystalpool.cxuesong.com/wiki/Crystal_Pool:Warriors_Family_Tree");
                props.onItemClick && props.onItemClick();
            }}>
                <ListItemIcon><LocalIcons.Cat /></ListItemIcon>
                <ListItemText primary={resourceManager.getPrompt("AboutThisApp")} secondary={resourceManager.getPrompt("AboutThisAppDescription")} />
            </ItemComponent>
        </List>);
});

export const EnvironmentInfoList: React.FC<IDrawerActionsProps> = React.forwardRef((props, ref: React.Ref<any>) => {
    return (<ThemeProvider theme={environmentInfoListTheme}>
        <List dense ref={ref}>
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
