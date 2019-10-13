type NestableObject = Record<string | number, string | number | boolean | {} | null | undefined>;
type FlattenedObject = Record<string | number, string | number | boolean | null | undefined>;
export function flattenKeyPath(obj: NestableObject): FlattenedObject {
    const result: FlattenedObject = {};
    function flattenInner(obj: NestableObject, path: string) {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const flattenedKey = path ? (path + "." + key) : key;
                const value = obj[key];
                if (typeof value === "object" && value) {
                    flattenInner(value, flattenedKey);
                } else {
                    result[flattenedKey] = value as any;
                }
            }
        }
    }
    flattenInner(obj, "");
    return result;
}
