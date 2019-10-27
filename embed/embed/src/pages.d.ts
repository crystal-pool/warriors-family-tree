import { IDisposable } from "tasklike-promise-library";
export interface IFamilyTreeOptions {
    qName: string;
    depth: number;
}
export declare function mountFamilyTree(container: HTMLElement, options: IFamilyTreeOptions): IDisposable;
