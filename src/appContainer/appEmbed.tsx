import { CssBaseline } from "@material-ui/core";
import * as React from "react";
import { InitializationScreen } from "../pages";
import { isOwnerWindowPresent, postReadyMessage } from "../utility/embedInterop";
import { appInsights } from "../utility/telemetry";
import { RoutesAfterInitialization } from "./routes";

export interface IAppEmbedProps {
    postMessageToken?: string;
}

export const AppEmbed: React.FC<IAppEmbedProps> = (props) => {
    React.useEffect(() => {
        const ownerPresent = isOwnerWindowPresent();
        if (ownerPresent && props.postMessageToken) {
            // tslint:disable-next-line: no-floating-promises
            postReadyMessage(props.postMessageToken);
        } else {
            appInsights.trackTrace({ message: "Not posting embed ready message.", properties: { ownerPresent, postMessageToken: props.postMessageToken } });
        }
    }, []);
    return (
        <div>
            <CssBaseline />
            <React.Suspense fallback={<InitializationScreen />}>
                <RoutesAfterInitialization embed />
            </React.Suspense>
        </div>
    );
};
