import { generatePath } from "react-router";
import { match, useRouteMatch } from "react-router-dom";

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

export type KnownRouteName = keyof typeof routePaths;

export function buildRoutePath(pathName: string, search?: string): string {
    if (search && !search.startsWith("?")) search = "?" + search;
    return "#" + pathName + (search || "");
}

function createRoutePathBuilder<TRoutingParams extends {}>(routeName: KnownRouteName) {
    return function (params?: TRoutingParams, search?: string): string {
        return buildRoutePath(generatePath(routePaths[routeName], params), search);
    };
}

export const routePathBuilders = {
    welcome: createRoutePathBuilder("welcome"),
    entityProfile: createRoutePathBuilder<IEntityRoutingParams>("entityProfile"),
    familyTree: createRoutePathBuilder<IFamilyTreeRoutingParams>("familyTree"),
};

export type KnownRouteMatch<TRouteName extends KnownRouteName = KnownRouteName> = match<NonNullable<Parameters<typeof routePathBuilders[TRouteName]>[0]>> & {route: TRouteName};

export function useKnownRouteMatch(): KnownRouteMatch<"welcome"> |  KnownRouteMatch<"familyTree"> |  KnownRouteMatch<"entityProfile"> | null {
    const match = useRouteMatch();
    if (!match) return null;
    for (const k in routePaths) {
        if (Object.prototype.hasOwnProperty.call(routePaths, k)) {
            const path = routePaths[k as KnownRouteName];
            if (match.path === path) {
                return {...match as any, route: k as KnownRouteName};
            }
        }
    }
    return null;
}
