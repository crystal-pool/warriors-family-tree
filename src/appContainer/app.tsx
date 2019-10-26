import * as React from "react";
import { match, Route, RouteComponentProps } from "react-router";
import { HashRouter } from "react-router-dom";
import { parseQueryParams } from "../utility/queryParams";
import { AppEmbed } from "./appEmbed";
import { AppFull } from "./appFull";

export interface IAppProps {
}

interface IRouteRootProps extends RouteComponentProps {
}

const RouteRoot: React.FC<IRouteRootProps> = (props) => {
    const queryParams = parseQueryParams(props.location.search);
    if (queryParams.embed) {
        return <AppEmbed />;
    } else {
        return <AppFull />;
    }
};

export const App: React.FC<IAppProps> = (props) => {
    return (
        <HashRouter>
            <Route component={RouteRoot} />
        </HashRouter>
    );
};
