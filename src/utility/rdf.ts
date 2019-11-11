import { RdfQName } from "../services/dataService";

export function isBlankNodeUri(expr: RdfQName): boolean {
    return expr === "_:";
}
