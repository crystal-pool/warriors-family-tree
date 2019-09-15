import { LinearProgress } from "@material-ui/core";
import * as React from "react";

export const InitializationScreen: React.FC = (props) => {
    return (<React.Fragment>
        <h2>Initializing…</h2>
        <p>Hold tight. We are still loading some data.</p>
        <LinearProgress />
    </React.Fragment>);
};
