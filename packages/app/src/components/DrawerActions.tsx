import { createTheme, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuItem, Tooltip } from "@mui/material";
import * as Icons from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import { resourceManager } from "../localization";
import { buildFeatureAnchorProps } from "../utility/featureUsage";
import * as LocalIcons from "../utility/muiIcons";

const environmentInfoListTheme = createTheme({
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
    children?: React.ReactNode;
}

export interface IDrawerActionsProps {
    asMenuItem?: boolean;
    onItemClick?: () => void;
}

// Need ref to make Tooltip work
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ItemComponent: React.FC<IItemComponentProps> = React.forwardRef((props, ref: React.Ref<any>) => {
    const { asMenuItem, children, ...rest } = props;
    if (asMenuItem) {
        return (<MenuItem ref={ref} {...rest}>{children}</MenuItem>);
    } else if (props.onClick || props.href) {
        return (<ListItemButton ref={ref} {...rest}>{children}</ListItemButton>);
    } else {
        return (<ListItem ref={ref} {...rest}>{children}</ListItem>);
    }
});

// Need ref to make Menu work
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AppActionsList: React.FC<IDrawerActionsProps> = React.forwardRef((props, ref: React.Ref<any>) => {
    return (
        <List ref={ref}>
            <ItemComponent onClick={() => {
                openUrl("https://github.com/crystal-pool/warriors-family-tree");
                props.onItemClick?.();
            }} {...buildFeatureAnchorProps("navigation.external.repo")}>
                <ListItemIcon><LocalIcons.GitHub /></ListItemIcon>
                <ListItemText primary="GitHub" secondary={resourceManager.getPrompt("StarTheRepo")} />
            </ItemComponent>
            <ItemComponent onClick={() => {
                openUrl("https://crystalpool.cxuesong.com/");
                props.onItemClick?.();
            }} {...buildFeatureAnchorProps("navigation.external.crystalpool.main")}>
                <ListItemIcon><Icons.Storage /></ListItemIcon>
                <ListItemText primary="Crystal Pool" secondary={resourceManager.getPrompt("ContributeToTheDataSource")} />
            </ItemComponent>
            <ItemComponent onClick={() => {
                openUrl("https://crystalpool.cxuesong.com/wiki/Crystal_Pool:Warriors_Family_Tree");
                props.onItemClick?.();
            }} {...buildFeatureAnchorProps("navigation.external.crystalpool.about")}>
                <ListItemIcon><LocalIcons.Cat /></ListItemIcon>
                <ListItemText primary={resourceManager.getPrompt("AboutThisApp")} secondary={resourceManager.getPrompt("AboutThisAppDescription")} />
            </ItemComponent>
        </List>);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EnvironmentInfoList: React.FC<IDrawerActionsProps> = React.forwardRef((props, ref: React.Ref<any>) => {
    return (<ThemeProvider theme={environmentInfoListTheme}>
        <List dense ref={ref}>
            {!environment.isProduction && <ListItem><ListItemText primary="Development Mode" /></ListItem>}
            <Tooltip title="Go to the source code of this revision.">
                <ItemComponent
                    onClick={() => {
                        openUrl("https://github.com/crystal-pool/warriors-family-tree/commit/" + environment.commitId);
                        props.onItemClick?.();
                    }} {...buildFeatureAnchorProps("navigation.external.repo.currentRevision")}>
                    <ListItemText primary="Version" secondary={environment.version || environment.commitId.substr(0, 8)} />
                </ItemComponent>
            </Tooltip>
            <ItemComponent>
                <ListItemText primary="Build time" secondary={new Date(environment.buildTimestamp).toISOString()} />
            </ItemComponent>
        </List >
    </ThemeProvider>);
});
