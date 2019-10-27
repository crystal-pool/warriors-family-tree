import { SeverityLevel } from "@microsoft/applicationinsights-web";
import { ResizeObserver } from "resize-observer";
import { ICancellationToken, PromiseLikeResolutionSource } from "tasklike-promise-library";
import { EmbedMessage, HostMessage, IHostSettings } from "../../shared/messages";
import { appInsights } from "./telemetry";

export function isOwnerWindowPresent(): boolean {
    return !!getOwnerWindow();
}

export function getOwnerWindow(): Window | undefined {
    if (window.parent !== window) return window.parent;
    if (window.opener instanceof Window) return window.opener;
    return undefined;
}

let currentToken: string | undefined;

export function postInteropMessage(message: EmbedMessage): boolean {
    const owner = getOwnerWindow();
    if (!owner) return false;
    if (!currentToken) return false;
    message.token = currentToken;
    owner.postMessage(message, "*");
    return true;
}

let readyPosted = false;

export function waitMessage<T extends HostMessage>(type: T["type"], cancellationToken?: ICancellationToken): PromiseLike<T> {
    const plrs = new PromiseLikeResolutionSource<T>();
    const cts = cancellationToken && cancellationToken.subscribe(() => {
        window.removeEventListener("message", handler);
        plrs.tryCancel();
    });
    function handler(e: MessageEvent) {
        if (e.data && typeof e.data === "object" && e.data.token === currentToken && e.data.type === type) {
            try {
                plrs.tryResolve(e.data);
            } finally {
                cts && cts.dispose();
                window.removeEventListener("message", handler);
            }
        }
    }
    window.addEventListener("message", handler);
    return plrs.promiseLike;
}

let documentHeightObserver: ResizeObserver | undefined;

export let hostSettings: IHostSettings | undefined;

export async function postReadyMessage(token: string): Promise<void> {
    if (readyPosted) throw new Error("ready message has already been posted");
    currentToken = token;
    appInsights.trackEvent({
        name: "postReadyMessage.embedReady",
        properties: { token }
    });
    if (!postInteropMessage({
        type: "ready",
        revision: environment.commitId,
        buildTimestamp: environment.buildTimestamp
    })) {
        appInsights.trackTrace({ message: "postReadyMessage: postInteropMessage failed.", severityLevel: SeverityLevel.Warning });
        return;
    }
    readyPosted = true;
    const message = await waitMessage("initialize");
    appInsights.trackEvent({
        name: "postReadyMessage.hostInitialize",
        properties: { message }
    });
    hostSettings = message.settings || {};
    if (hostSettings.observeDocumentHeight) {
        observeDocumentHeight();
    }
    document.body.classList.add("embed");
    if (!hostSettings.scrollable) {
        document.body.classList.add("noscroll");
    }
}

function observeDocumentHeight(): void {
    if (documentHeightObserver) return;
    let currentHeight = 0;
    documentHeightObserver = new window.ResizeObserver(() => {
        const h = document.documentElement.offsetHeight;
        if (h !== currentHeight) {
            postInteropMessage({ type: "documentHeightChanged", height: h });
            currentHeight = h;
        }
    });
    documentHeightObserver.observe(document.documentElement);
}
