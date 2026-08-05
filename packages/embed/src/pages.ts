import * as Errors from "jscorlib/errors";
import { IEmbedIntrinsicOptions, mountEmbed } from "./embed";
import { ExplicitDisposable } from "./typing";

export interface IFamilyTreeOptions {
    qName: string;
    depth: number;
    embedOptions?: IEmbedIntrinsicOptions;
}

export function mountFamilyTree(container: HTMLElement, options: IFamilyTreeOptions): ExplicitDisposable {
    Errors.checkArgumentType(0, "container", container, HTMLElement);
    Errors.checkArgumentType(1, "options", options, "object");
    return mountEmbed(container, {
        route: `/familyTree/${options.qName}`,
        queryParams: { depth: options.depth },
        embedOptions: options.embedOptions,
    });
}
