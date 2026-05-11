import { installPolyfill as installDisposablePolyfill } from "@jscorlib/polyfills/explicit-resource-management";
import { EmbedMessage, HostMessage, IHostSettings, isInteropMessage } from "@wft-repo/shared";
import { ExplicitDisposable } from "./typing";

installDisposablePolyfill({});

export interface IEmbedIntrinsicOptions {
    urlStem?: string;
    className?: string;
    style?: Record<string, string | 0 | null>;
    autoResize?: boolean;
    scrollable?: boolean;
    eagerRender?: boolean;
    /**
     * The `background-color` CSS value of the family tree app.
     * Use `"transparent"` for transparent background (if supported).
     */
    backgroundColor?: string;
}

export interface IEmbedOptions {
    route?: string;
    queryParams?: string | Record<string, unknown>;
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
export function mountEmbed(container: HTMLElement, options?: IEmbedOptions): ExplicitDisposable {
    if (!(container && container instanceof HTMLElement))
        throw new TypeError("container should be an HTMLElement object.");
    if (options && !(typeof options === "object"))
        throw new TypeError("options should be an IEmbedOptions object.");

    options = options ?? {};
    const intrinsicOptions = options.embedOptions ?? {};
    let url = intrinsicOptions.urlStem || defaultAppUrlStem;
    const postMessageToken = "wft-pmt-" + Math.round(Math.random() * 2821109907456).toString(36);

    using disposables = new DisposableStack();

    if (options.route) url += options.route;
    if (options.queryParams) {
        let builder: URLSearchParams | undefined;
        if (typeof options.queryParams === "object") {
            builder = new URLSearchParams();
            for (const k in options.queryParams) {
                if (Object.prototype.hasOwnProperty.call(options.queryParams, k)) {
                    const v = options.queryParams[k];
                    if (v != null) {
                        builder.append(k, String(v));
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

    function renderIFrame() {
        const frame = document.createElement("iframe");
        frame.className = ["warriors-family-tree-embed", intrinsicOptions.className].join(" ").trim();
        if (intrinsicOptions.style) {
            for (const k in intrinsicOptions.style) {
                if (Object.prototype.hasOwnProperty.call(intrinsicOptions.style, k)) {
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
        const autoResize = intrinsicOptions.autoResize ?? true;
        const embedMessageTarget = new EmbedMessageTarget(frame, postMessageToken, {
            observeDocumentHeight: autoResize,
            scrollable: intrinsicOptions.scrollable,
            backgroundColor: intrinsicOptions.backgroundColor,
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
        disposables.use(embedMessageTarget);
        disposables.defer(() => frame.remove());
    }

    if (intrinsicOptions.eagerRender) {
        renderIFrame();
    } else {
        disposables.use(new DeferredRenderPlaceholder(
            container,
            intrinsicOptions.style?.height ?? "300px",
            renderIFrame,
        ));
    }
    return disposables.move();
}

class DeferredRenderPlaceholder implements Disposable {
    private readonly _disposables: DisposableStack;
    private _onRender: (() => void) | undefined;

    public constructor(
        container: HTMLElement,
        height: string | 0,
        onRender: () => void,
    ) {
        using disposables = new DisposableStack();
        this._onRender = onRender;

        const placeholder = document.createElement("div");
        placeholder.innerHTML = ""
            + `<p>Did not see family tree?</p>`
            + `<button>Click here to load it!</button>`;
        placeholder
            .querySelector("button")!
            .addEventListener("focus", this._triggerRender);
        // 300px is the default IFrame height.
        placeholder.style.height = String(height);
        container.appendChild(placeholder);
        disposables.defer(() => placeholder.remove());

        const observer = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) {
                this._triggerRender();
            }
        }, { rootMargin: "-10px" });
        disposables.defer(() => observer.disconnect());
        observer.observe(container);

        this._disposables = disposables.move();
    }

    private readonly _triggerRender = (): void => {
        if (this._disposables.disposed) return;
        const onRender = this._onRender;
        this[Symbol.dispose]();
        onRender?.();
    };

    public [Symbol.dispose](): void {
        this._onRender = undefined;
        this._disposables.dispose();
    }
}

class EmbedMessageTarget implements Disposable {
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
        this._embedFrame.contentWindow.postMessage(message, "*");
    }
    public [Symbol.dispose](): void {
        window.removeEventListener("message", this._onMessage);
    }
    private readonly _onMessage = (e: MessageEvent): void => {
        if (e.isTrusted && isInteropMessage(e.data) && e.data.token === this._messageToken) {
            const message = e.data as EmbedMessage;
            if (!environment.isProduction) {
                console.log("EmbedMessageTarget._onMessage", e);
            }
            switch (message.type) {
                case "ready":
                    this.postMessage({
                        type: "initialize",
                        url: location.href,
                        revision: environment.commitId,
                        buildTimestamp: environment.buildTimestamp,
                        settings: this._hostSettings
                    });
                    break;
            }
            this._messageCallback(message);
        }
    };
}
