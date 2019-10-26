import { CssBaseline } from "@material-ui/core";
import * as React from "react";
import { InitializationScreen } from "../pages";
import { RoutesAfterInitialization } from "./routes";

export const AppEmbed: React.FC = (props) => {
    return (
        <div>
            <CssBaseline />
            <React.Suspense fallback={<InitializationScreen />}>
                <RoutesAfterInitialization embed />
            </React.Suspense>
        </div>
    );
};
