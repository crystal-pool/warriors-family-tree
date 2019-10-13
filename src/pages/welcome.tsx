import { Typography } from "@material-ui/core";
import * as React from "react";
import { EntitySearchBox } from "../components/EntitySearchBox";
import { resourceManager } from "../localization";
import { appInsights } from "../utility/telemetry";
import { routePathBuilders } from "./routes";
import { setDocumentTitle } from "../utility/general";

export const Welcome: React.FC = (props) => {
    React.useEffect(() => {
        setDocumentTitle(resourceManager.getPrompt("WelcomeTitle"));
        appInsights.trackPageView();
    });
    return (<React.Fragment>
        <h1>{resourceManager.getPrompt("WelcomeTitle")}</h1>
        <Typography variant="subtitle1" dangerouslySetInnerHTML={{ __html: resourceManager.getPrompt("WelcomeDescription") }}></Typography>
        <EntitySearchBox onAccept={(qName) => {
            location.href = routePathBuilders.familyTree({ character: qName });
        }} />
    </React.Fragment>);
};
