import { Typography } from "@material-ui/core";
import * as React from "react";
import { EntitySearchBox } from "../components/EntitySearchBox";
import { appInsights } from "../utility/telemetry";
import { routePathBuilders } from "./routes";

export const Welcome: React.FC = (props) => {
    React.useEffect(() => {
        document.title = "Welcome - Warriors Family Tree";
        appInsights.trackPageView();
    });
    return (<React.Fragment>
        <h1>Welcome</h1>
        <Typography variant="subtitle1">This is a still work-in-progress automatic family tree for <i>Warriors</i> series.</Typography>
        <Typography variant="subtitle1">Type something to in the search box below to continue. E.g. type <strong>Firestar</strong> and press enter.</Typography>
        <EntitySearchBox onAccept={(qName) => {
            location.href = routePathBuilders.familyTree({ character: qName });
        }} />
    </React.Fragment>);
};
