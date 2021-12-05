import * as React from "react";
import { Route, Routes } from "react-router";
import * as Pages from "../pages";
import { dataService } from "../services";

export interface IRoutesProps {
    embed?: boolean;
}

export const AppRoutes: React.FC<IRoutesProps> = (props) => {
    return (<Routes>
        <Route path={Pages.routePaths.welcome} element={<Pages.Welcome />} />
        <Route path={Pages.routePaths.familyTree} element={<Pages.FamilyTree />} />
        <Route path={Pages.routePaths.entityProfile} element={<Pages.EntityProfile />} />
    </Routes>);
};

export const RoutesAfterInitialization = React.lazy(async () => {
    await dataService.initialization;
    return { default: AppRoutes };
});
