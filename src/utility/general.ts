export function buildUnorderedIdPair(id1: string, id2?: string | null): string {
    if (id2 == null) return id1;
    return id1 <= id2 ? id1 + "\x00" + id2 : id2 + "\x00" + id1;
}

export function parseUnorderedIdPair(expr: string): [string, string | undefined] {
    const pos = expr.indexOf("\x00");
    return pos >= 0 ? [expr.substr(0, pos), expr.substr(pos + 1)] : [expr, undefined];
}

export function setDocumentTitle(title: string): void {
    document.title = (title ? (title + " - ") : "") + "Warriors Family Tree";
}
