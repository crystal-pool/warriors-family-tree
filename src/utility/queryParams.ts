export interface IQueryParams {
    embed?: boolean;
    pmToken?: string;
    depth?: number;
}

const intrinsicParamNames: Array<keyof IQueryParams> = ["embed", "pmToken"];

/**
 * Parses the pseudo-query string in the URI.
 */
export function parseQueryParams(queryExpr: string | URLSearchParams): IQueryParams {
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
    let s = typeof queryExpr === "string" ? new URLSearchParams(queryExpr) : queryExpr;
    return {
        embed: parseBoolean(s.get("embed")),
        depth: parseIntNumber(s.get("depth")),
        pmToken: s.get("pmToken") || undefined
    };
}

export function setQueryParams<T extends IQueryParams>(queryExpr: string | URLSearchParams, replacements: { [k in keyof T]?: T[k] | null }): string {
    let s = typeof queryExpr === "string" ? new URLSearchParams(queryExpr) : queryExpr;
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

export function resetQueryParams<T extends IQueryParams>(queryExpr: string, params?: { [k in keyof T]?: T[k] | null }): string {
    let s = new URLSearchParams(queryExpr);
    const allParams: Record<string, string> = {};
    for (const k of intrinsicParamNames) {
        if (s.has(k)) allParams[k] = s.get(k)!;
    }
    Object.assign(allParams, params);
    return String(new URLSearchParams(allParams));
}
