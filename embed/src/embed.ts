import { IDisposable } from "tasklike-promise-library";
import { EmbedMessage, HostMessage, IHostSettings } from "../../shared/messages";

export interface IEmbedIntrinsicOptions {
    urlStem?: string;
    className?: string;
    style?: Record<string, string | 0 | null>;
    autoResize?: boolean;
    scrollable?: boolean;
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
    const postMessageToken = "wft-pmt-" + Math.round(Math.random() * 2821109907456).toString(36);
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
        builder.set("pmToken", postMessageToken);
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
        frame.style.transition = "height 0.5s ease-out";
    }
    frame.allow = "fullscreen";
    frame.sandbox.add("allow-popups", "allow-popups-to-escape-sandbox", "allow-scripts", "allow-same-origin");
    const autoResize = intrinsicOptions.autoResize == null ? true : intrinsicOptions.autoResize;
    const embedMessageTarget = new EmbedMessageTarget(frame, postMessageToken, {
        observeDocumentHeight: autoResize,
        scrollable: intrinsicOptions.scrollable
    }, (message) => {
        switch (message.type) {
            case "documentHeightChanged":
                if (autoResize) {
                    frame.style.height = message.height + "px";
                }
                break;
        }
    });
    frame.src = url;
    container.appendChild(frame);
    return {
        dispose() {
            embedMessageTarget.dispose();
            frame.remove();
        }
    };
}

class EmbedMessageTarget implements IDisposable {
    public constructor(
        private readonly _embedFrame: HTMLIFrameElement,
        private readonly _messageToken: string,
        private readonly _hostSettings: IHostSettings,
        private readonly _messageCallback: (message: EmbedMessage) => void) {
        window.addEventListener("message", this._onMessage);
    }
    public postMessage(message: HostMessage): void {
        if (!message.token) message.token = this._messageToken;
        if (!this._embedFrame.contentWindow)
            throw new Error("Cannot postMessage to the embed <iframe>.");
        this._embedFrame.contentWindow!.postMessage(message, "*");
    }
    public dispose(): void {
        window.removeEventListener("message", this._onMessage);
    }
    private readonly _onMessage = (e: MessageEvent): void => {
        if (e.isTrusted && e.data && typeof e.data === "object" && e.data.token === this._messageToken && typeof e.data.type === "string") {
            const message = e.data as EmbedMessage;
            if (!environment.isProduction) {
                console.log("EmbedMessageTarget._onMessage", e);
            }
            switch (message.type) {
                case "ready":
                    this.postMessage({
                        type: "initialize",
                        revision: environment.commitId,
                        buildTimestamp: environment.buildTimestamp,
                        settings: this._hostSettings
                    });
                    break;
            }
            this._messageCallback(message);
        }
    }
}
