import { generatePath } from "react-router";

export interface IFamilyTreeRoutingParams {
    character?: string;
}

export interface IEntityRoutingParams {
    qName?: string;
}

export const routePaths = {
    welcome: "/",
    entityProfile: "/entity/:qName",
    familyTree: "/familyTree/:character",
};

export function buildRoutePath(pathName: string, search?: string): string {
    if (search && !search.startsWith("?")) search = "?" + search;
    return "#" + pathName + (search || "");
}

function createRoutePathBuilder<TRoutingParams extends {}>(routeName: keyof typeof routePaths) {
    return function (params?: TRoutingParams, search?: string): string {
        return buildRoutePath(generatePath(routePaths[routeName], params), search);
    };
}

export const routePathBuilders = {
    welcome: createRoutePathBuilder("welcome"),
    entityProfile: createRoutePathBuilder<IEntityRoutingParams>("entityProfile"),
    familyTree: createRoutePathBuilder<IFamilyTreeRoutingParams>("familyTree"),
};
