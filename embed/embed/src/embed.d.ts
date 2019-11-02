import { IDisposable } from "tasklike-promise-library";
export interface IEmbedIntrinsicOptions {
    urlStem?: string;
    className?: string;
    style?: Record<string, string | 0 | null>;
    autoResize?: boolean;
    scrollable?: boolean;
    eagerRender?: boolean;
}
export interface IEmbedOptions {
    route?: string;
    queryParams?: string | Record<string, any>;
    embedOptions?: IEmbedIntrinsicOptions;
}
/**
 * The URL prefix of Warriors Family Tree.
 */
export declare const defaultAppUrlStem: string;
/**
 * Embeds the Warriors Family Tree inside the specified HTML element.
 * @param container The HTML element that will host the embed. An empty `<div>` element is okay for this.
 * @param options Additional options.
 */
export declare function mountEmbed(container: HTMLElement, options?: IEmbedOptions): IDisposable;
