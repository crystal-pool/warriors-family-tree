import { generatePath, Params } from "react-router";

export type FamilyTreeRoutingParams = "character";

export type EntityRoutingParams = "qName";

export const routePaths = {
    welcome: "/",
    entityProfile: "/entity/:qName",
    familyTree: "/familyTree/:character",
};

export type KnownRouteName = keyof typeof routePaths;

export function buildRoutePath(pathName: string, search?: string | URLSearchParams): string {
    if (search && typeof search !== 'string') search = String(search);
    if (search && (!search.startsWith("?"))) search = "?" + search;
    return "#" + pathName + (search || "");
}

function createRoutePathBuilder<TRoutingParams extends string>(routeName: KnownRouteName) {
    return function (params?: Params<TRoutingParams>, search?: string | URLSearchParams): string {
        return buildRoutePath(generatePath(routePaths[routeName], params), search);
    };
}

export const routePathBuilders = {
    welcome: createRoutePathBuilder("welcome"),
    entityProfile: createRoutePathBuilder<EntityRoutingParams>("entityProfile"),
    familyTree: createRoutePathBuilder<FamilyTreeRoutingParams>("familyTree"),
};
