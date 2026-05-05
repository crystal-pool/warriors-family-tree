import { IDisposable } from "tasklike-promise-library";
import { mountEmbed } from "./embed";

export interface IFamilyTreeOptions {
    qName: string;
    depth: number;
}

export function mountFamilyTree(container: HTMLElement, options: IFamilyTreeOptions): IDisposable {
    if (!options)
        throw new TypeError("options argument is required.");
    if (!(typeof options === "object"))
        throw new TypeError("options should be an IFamilyTreeOptions object.");
    return mountEmbed(container, {
        route: `/familyTree/${options.qName}`,
        queryParams: { depth: options.depth }
    });
}
