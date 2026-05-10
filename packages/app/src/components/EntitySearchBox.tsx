import { Autocomplete, InputBase, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import * as React from "react";
import { resourceManager } from "../localization";
import { dataService } from "../services";
import { IEntityLookupResultItem, RdfQName } from "../services/dataService";

export interface IEntitySearchBoxProps {
    classes?: Partial<Record<string, string>>;
    onAccept: (qName: RdfQName) => void;
}

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

function getOptionLabel(option: IEntityLookupResultItem | string): string {
    if (typeof option === "string") return option;
    const label = dataService.getLabelFor(option.qName);
    return label?.label || option.keyword || option.qName;
}

export const EntitySearchBox: React.FC<IEntitySearchBoxProps> = React.memo((props) => {
    const [inputValue, setInputValue] = React.useState("");
    const options = React.useMemo(() => searchEntities(inputValue), [inputValue]);
    return (
        <Autocomplete
            freeSolo
            options={options}
            filterOptions={(x) => x}
            getOptionLabel={getOptionLabel}
            inputValue={inputValue}
            onInputChange={(_e, value, reason) => {
                if (reason !== "reset") {
                    setInputValue(value);
                }
            }}
            onChange={(_e, value) => {
                if (value && typeof value !== "string") {
                    const label = dataService.getLabelFor(value.qName);
                    setInputValue(label?.label || value.qName);
                    props.onAccept(value.qName);
                }
            }}
            renderOption={(optionProps, option) => {
                const label = dataService.getLabelFor(option.qName);
                let header = option.keyword || option.qName;
                let details = "";
                if (label?.label) {
                    header = label.label;
                    if (label.label !== option.keyword) {
                        header += " (" + option.keyword + ")";
                    }
                    if (label.description) {
                        details = label.description;
                    }
                }
                return (
                    <li {...optionProps} key={option.qName}>
                        <div>
                            <Typography variant="body1">{header}</Typography>
                            {details && <Typography variant="body2" sx={{ opacity: 0.7 }}>{details}</Typography>}
                        </div>
                    </li>
                );
            }}
            slotProps={{
                paper: { square: true, sx: { opacity: 0.9 } },
            }}
            isOptionEqualToValue={(option, value) => typeof value !== "string" && option.qName === value.qName}
            renderInput={(params) => {
                const { slotProps, id, disabled, fullWidth, ...rootProps } = params;
                return (
                    <div {...rootProps} ref={slotProps.input.ref} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <div style={{
                            width: 40, height: "100%", position: "absolute",
                            pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <SearchIcon />
                        </div>
                        <InputBase
                            id={id}
                            disabled={disabled}
                            fullWidth={fullWidth}
                            inputProps={slotProps.htmlInput}
                            placeholder={resourceManager.getPrompt("EntitySearchBoxPlaceholder")}
                            sx={{ color: "inherit", width: "100%", pl: 5 }}
                        />
                    </div>
                );
            }}
            sx={{ flexGrow: 1 }}
        />
    );
});
