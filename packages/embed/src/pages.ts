import { IEmbedIntrinsicOptions, mountEmbed } from "./embed";
import { ExplicitDisposable } from "./typing";

export interface IFamilyTreeOptions {
    qName: string;
    depth: number;
    embedOptions?: IEmbedIntrinsicOptions;
}

export function mountFamilyTree(container: HTMLElement, options: IFamilyTreeOptions): ExplicitDisposable {
    if (!options)
        throw new TypeError("options argument is required.");
    if (!(typeof options === "object"))
        throw new TypeError("options should be an IFamilyTreeOptions object.");
    return mountEmbed(container, {
        route: `/familyTree/${options.qName}`,
        queryParams: { depth: options.depth },
        embedOptions: options.embedOptions,
    });
}
