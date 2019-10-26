export interface IQueryParams {
    embed?: boolean;
}

/**
 * Parses the pseudo-query string in the URI.
 */
export function parseQueryParams(queryExpr: string): IQueryParams {
    function parseBoolean(expr: string | null | undefined): boolean | undefined {
        if (!expr) return undefined;
        switch (expr.toLowerCase()) {
            case "true":
            case "yes":
            case "on":
            case "1":
                return true;
            case "false":
            case "no":
            case "off":
            case "0":
                return false;
            default:
                throw new RangeError("Invalid boolean expression in query params.");
        }
    }
    var s = new URLSearchParams(queryExpr);
    return {
        embed: parseBoolean(s.get("embed"))
    };
}
