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

// cyrb53
// https://stackoverflow.com/a/52171480/4763572
export function hashString(str: string, seed = 0): number {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ h1>>>16, 2246822507) ^ Math.imul(h2 ^ h2>>>13, 3266489909);
    h2 = Math.imul(h2 ^ h2>>>16, 2246822507) ^ Math.imul(h1 ^ h1>>>13, 3266489909);
    return 4294967296 * (2097151 & h2) + (h1>>>0);
}
