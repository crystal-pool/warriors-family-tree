import { createStyles, InputBase, makeStyles, MenuItem, Paper, Theme, Typography } from "@material-ui/core";
import { MenuItemProps } from "@material-ui/core/MenuItem";
import SearchIcon from "@material-ui/icons/Search";
import Downshift from "downshift";
import * as React from "react";
import { dataService } from "../services";
import { IEntityLookupResultItem, RdfQName } from "../services/dataService";
import { resourceManager } from "../localization";

export type EntitySearchBoxClassName = "root"
    | "searchIcon" | "inputRoot" | "inputInput"
    | "autoCompletePopup" | "autoCompleteItemRoot" | "autoCompleteItem" | "autoCompleteItemHeader" | "autoCompleteItemDetails";

export interface IEntitySearchBoxProps {
    classes?: Partial<Record<EntitySearchBoxClassName, string>>;
    onAccept: (qName: RdfQName) => void;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles<EntitySearchBoxClassName, IEntitySearchBoxProps>({
        root: {
            position: "relative"
        },
        searchIcon: {
            width: theme.spacing(7),
            height: "100%",
            position: "absolute",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
        inputRoot: {
            color: "inherit",
            width: "100%"
        },
        inputInput: {
            padding: theme.spacing(1, 1, 1, 7),
            margin: 0,
            width: "auto"
        },
        autoCompletePopup: {
            position: "absolute",
            zIndex: 1,
            marginTop: theme.spacing(1),
            left: 0,
            right: 0,
            maxHeight: "80vh",
            opacity: 0.9,
            overflowY: "auto"
        },
        autoCompleteItemRoot: {
            whiteSpace: "normal"
        },
        autoCompleteItem: {
        },
        autoCompleteItemHeader: {
        },
        autoCompleteItemDetails: {
            opacity: 0.7
        }
    }),
);

interface ISuggestionItemProps {
    data: IEntityLookupResultItem;
    isActive: boolean;
    isSelected: boolean;
    itemProps: MenuItemProps<"div", { button?: never }>;
    classes: Record<EntitySearchBoxClassName, string>;
}

const EntitySuggestionItem: React.FC<ISuggestionItemProps> = React.memo((props) => {
    const label = dataService.getLabelFor(props.data.qName);
    let header = props.data.keyword || props.data.qName;
    let details = "";
    if (label) {
        if (label.label) {
            header = label.label;
            if (label.label !== props.data.keyword) {
                header += " (" + props.data.keyword + ")";
            }
            if (label.description) {
                details = label.description;
            }
        }
    }
    return (
        <MenuItem
            {...props.itemProps}
            selected={props.isActive}
            component="div"
            classes={
                { root: props.classes.autoCompleteItemRoot }
            }
            style={{
                fontWeight: props.isSelected ? 500 : 400,
            }}
        >
            <div className={props.classes.autoCompleteItem}>
                <Typography variant="body1" className={props.classes.autoCompleteItemHeader}>{header}</Typography>
                {details && <Typography variant="body2" className={props.classes.autoCompleteItemDetails}>{details}</Typography>}
            </div>
        </MenuItem>
    );
});

function searchEntities(searchExpr: string): IEntityLookupResultItem[] {
    const searchResult = dataService.lookupEntity(searchExpr, 50);
    const entityIdMatch = searchExpr.match(/^\s*(wd:)?(Q\d+)/ui);
    // Supports search pattern like Q1234 .
    if (entityIdMatch) {
        const entityId = entityIdMatch[2].toUpperCase();
        const qName = "wd:" + entityId;
        searchResult.splice(0, 0, { qName: qName, keyword: qName, keywordMatchRange: [0, qName.length], score: -1 });
    }
    return searchResult;
}

export const EntitySearchBox: React.FC<IEntitySearchBoxProps> = React.memo((props) => {
    const classes = useStyles(props);
    const [searchExpr, setSearchExpr] = React.useState("");
    const suggestions = React.useMemo(() => searchEntities(searchExpr), [searchExpr]);
    return (
        <Downshift
            itemToString={(item: IEntityLookupResultItem) => item && item.qName}
            onChange={(value?: string) => {
                if (value) {
                    const label = dataService.getLabelFor(value);
                    setSearchExpr(label && label.label || value);
                    props.onAccept(value);
                }
            }}
        >{
                (options) => {
                    const { onBlur, onChange, onFocus, ...inputProps } = options.getInputProps({
                        "aria-label": "search",
                        placeholder: resourceManager.getPrompt("EntitySearchBoxPlaceholder"),
                        value: searchExpr,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            if (e.target.value === "") {
                                options.clearSelection();
                            }
                            setSearchExpr(e.target.value);
                        },
                        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                            // Use Enter to accept the first item.
                            if (e.key === "Enter" && suggestions.length > 0) {
                                options.selectItemAtIndex(0);
                            }
                        },
                        onFocus: options.openMenu,
                    });
                    return (<div className={classes.root}>
                        <div className={classes.searchIcon}>
                            <SearchIcon />
                        </div>
                        <InputBase
                            classes={{
                                root: classes.inputRoot,
                                input: classes.inputInput,
                            }}
                            {...{ onBlur, onChange, onFocus }}
                            inputProps={inputProps}
                        />
                        <div {...options.getMenuProps()}>
                            {options.isOpen ? (
                                <Paper className={classes.autoCompletePopup} square>
                                    {suggestions.map((data, i) => (<EntitySuggestionItem
                                        data={data}
                                        key={i}
                                        isActive={options.highlightedIndex === i}
                                        isSelected={options.selectedItem === data.qName}
                                        itemProps={options.getItemProps({ item: data.qName })}
                                        classes={classes}
                                    />))}
                                </Paper>
                            ) : null}
                        </div>
                    </div>);
                }
            }</Downshift>);
});
