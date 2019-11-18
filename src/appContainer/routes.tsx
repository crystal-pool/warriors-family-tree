import * as React from "react";
import { Route } from "react-router";
import * as Pages from "../pages";
import { dataService } from "../services";

export interface IRoutesProps {
    embed?: boolean;
}

export const Routes: React.FC<IRoutesProps> = (props) => {
    return (<React.Fragment>
        <Route exact path={Pages.routePaths.welcome} component={Pages.Welcome} />
        <Route path={Pages.routePaths.familyTree} component={Pages.FamilyTree} />
        <Route path={Pages.routePaths.entity} component={Pages.Entity} />
    </React.Fragment>);
};

export const RoutesAfterInitialization = React.lazy(async () => {
    await dataService.initialization;
    return { default: Routes };
});
