export interface IQueryParams {
    embed?: boolean;
    depth?: number;
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
    function parseIntNumber(expr: string | null | undefined): number | undefined {
        if (!expr) return undefined;
        const parsed = parseInt(expr);
        if (isNaN(parsed))
            throw new RangeError("Invalid integer expression in query params.");
        return parsed;
    }
    var s = new URLSearchParams(queryExpr);
    return {
        embed: parseBoolean(s.get("embed")),
        depth: parseIntNumber(s.get("depth"))
    };
}

export function setQueryParams<T extends IQueryParams>(queryExpr: string, replacements: Partial<T>): string {
    var s = new URLSearchParams(queryExpr);
    for (const k in replacements) {
        if (replacements.hasOwnProperty(k)) {
            const v = replacements[k];
            if (v === null)
                s.delete(k);
            else
                s.set(k, String(v));
        }
    }
    return String(s);
}
