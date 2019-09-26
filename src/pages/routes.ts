import { generatePath } from "react-router";

export interface IFamilyTreeRoutingParams {
    character?: string;
}

export const routePaths = {
    welcome: "/",
    familyTree: "/familyTree/:character"
};

function createRoutePathBuilder<TRoutingParams extends {}>(routeName: keyof typeof routePaths) {
    return function (params?: TRoutingParams): string {
        return generatePath("#" + routePaths[routeName], params);
    };
}

export const routePathBuilders = {
    welcome: createRoutePathBuilder("welcome"),
    familyTree: createRoutePathBuilder<IFamilyTreeRoutingParams>("familyTree"),
};
