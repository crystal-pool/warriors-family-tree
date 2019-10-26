import { CssBaseline } from "@material-ui/core";
import * as React from "react";
import { PromiseLikeResolutionSource } from "tasklike-promise-library";
import { InitializationScreen } from "../pages";
import { dataService } from "../services";
import { RoutesAfterInitialization } from "./routes";

export const AppEmbed: React.FC = (props) => {
    const [dataInitialized, setDataInitialized] = React.useState(dataService.isInitialized);
    React.useEffect(() => {
        if (dataInitialized) { return; }
        const cleanupPrs = new PromiseLikeResolutionSource();
        Promise.race([cleanupPrs.promiseLike, dataService.initialization])
            .then(p => cleanupPrs && cleanupPrs.tryResolve() && setDataInitialized(true));
        return () => { cleanupPrs.tryResolve(); };
    });
    return (
        <div>
            <CssBaseline />
            <React.Suspense fallback={<InitializationScreen />}>
                <RoutesAfterInitialization embed />
            </React.Suspense>
        </div>
    );
}
