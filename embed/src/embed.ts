import { IDisposable } from "tasklike-promise-library";

export interface IEmbedIntrinsicOptions {
    urlStem?: string;
    className?: string;
    style?: Record<string, string | 0 | null>;
}

export interface IEmbedOptions {
    route?: string;
    queryParams?: string | Record<string, any>;
    embedOptions?: IEmbedIntrinsicOptions;
}

/**
 * The URL prefix of Warriors Family Tree.
 */
export const defaultAppUrlStem = environment.isProduction ? "https://crystal-pool.github.io/warriors-family-tree/#" : "http://localhost:3080/#";

/**
 * Embeds the Warriors Family Tree inside the specified HTML element.
 * @param container The HTML element that will host the embed. An empty `<div>` element is okay for this.
 * @param options Additional options.
 */
export function mountEmbed(container: HTMLElement, options?: IEmbedOptions): IDisposable {
    if (!(container && container instanceof HTMLElement))
        throw new TypeError("container should be an HTMLElement object.");
    if (options && !(typeof options === "object"))
        throw new TypeError("options should be an IEmbedOptions object.");
    options = options || {};
    const intrinsicOptions = options.embedOptions || {};
    let url = intrinsicOptions.urlStem || defaultAppUrlStem;
    if (options.route) url += options.route;
    if (options.queryParams) {
        let builder: URLSearchParams | undefined;
        if (typeof options.queryParams === "object") {
            builder = new URLSearchParams();
            for (const k in options.queryParams) {
                if (options.queryParams.hasOwnProperty(k)) {
                    const v = options.queryParams[k];
                    if (v != null) {
                        builder.append(k, v);
                    }
                }
            }
        } else {
            builder = new URLSearchParams(options.queryParams);
        }
        builder.set("embed", "true");
        url += "?" + String(builder);
    }
    const frame = document.createElement("iframe");
    frame.className = "warriors-family-tree-embed " + (intrinsicOptions.className || "");
    if (intrinsicOptions.style) {
        for (const k in intrinsicOptions.style) {
            if (intrinsicOptions.style.hasOwnProperty(k)) {
                let v = intrinsicOptions.style[k];
                if (typeof v === "number") v = String(v);
                frame.style.setProperty(k, v);
            }
        }
    } else {
        // Style preset
        frame.style.borderWidth = "0";
        frame.style.width = "100%";
    }
    frame.allow = "fullscreen";
    frame.sandbox.add("allow-popups", "allow-popups-to-escape-sandbox", "allow-scripts", "allow-same-origin");
    frame.src = url;
    container.appendChild(frame);
    return {
        dispose() {
            frame.remove();
        }
    };
}
