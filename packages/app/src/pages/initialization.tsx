import { LinearProgress } from "@material-ui/core";
import * as React from "react";
import { resourceManager } from "../localization";
import { setDocumentTitle } from "../utility/general";

export const InitializationScreen: React.FC = React.memo((props) => {
    setDocumentTitle(resourceManager.getPrompt("InitializationTitle"));
    return (<React.Fragment>
        <h2>{resourceManager.getPrompt("InitializationTitle")}</h2>
        <p>{resourceManager.getPrompt("InitializationDescription")}</p>
        <LinearProgress />
    </React.Fragment>);
});
