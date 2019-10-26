import * as React from "react";
import { Route } from "react-router";
import * as Pages from "../pages";

export const Routes: React.FC = (props) => {
    return (<React.Fragment>
    <Route exact path={Pages.routePaths.welcome} component={Pages.Welcome} />
    <Route path={Pages.routePaths.familyTree} component={Pages.FamilyTree} />
</React.Fragment>);
};
