import { generatePath } from "react-router";

export interface IFamilyTreeRoutingParams {
    character?: string;
}

export const routePaths = {
    welcome: "/",
    familyTree: "/familyTree/:character"
};

function createRoutePathBuilder<TRoutingParams extends {}>(routeName: keyof typeof routePaths) {
    return function (params?: TRoutingParams, search?: string): string {
        if (search && !search.startsWith("?")) search = "?" + search;
        return "#" + generatePath(routePaths[routeName], params) + search;
    };
}

export const routePathBuilders = {
    welcome: createRoutePathBuilder("welcome"),
    familyTree: createRoutePathBuilder<IFamilyTreeRoutingParams>("familyTree"),
};
