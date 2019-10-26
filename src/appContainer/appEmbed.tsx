import { CssBaseline } from "@material-ui/core";
import React from "react";
import { Routes } from "./routes";

export const AppEmbed: React.FC = (props) => {
    return (
        <div>
            <CssBaseline />
            <Routes />
        </div>
    );
}
