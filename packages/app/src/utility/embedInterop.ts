import { SeverityLevel } from "@microsoft/applicationinsights-web";
import { EmbedMessage, HostMessage, IHostSettings, isInteropMessage } from "@wft-repo/shared";
import { wait } from "jscorlib/promises";
import * as _ from "lodash-es";
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

export async function waitMessage<T extends HostMessage>(type: T["type"], signal?: AbortSignal): Promise<T> {
    const { promise, resolve } = Promise.withResolvers<T>();
    function handler(e: MessageEvent) {
        if (isInteropMessage(e.data) && e.data.token === currentToken && e.data.type === type) {
            resolve(e.data as T);
        }
    }
    window.addEventListener("message", handler);
    try {
        return await wait(promise, signal);
    } finally {
        window.removeEventListener("message", handler);
    }
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
    hostSettings = message.settings ?? {};
    if (hostSettings.observeDocumentHeight) {
        observeDocumentHeight();
    }
    if (hostSettings.backgroundColor) {
        document.body.style.backgroundColor = hostSettings.backgroundColor;
    }
    document.body.classList.add("embed");
    if (!hostSettings.scrollable) {
        document.body.classList.add("noscroll");
    }
}

function observeDocumentHeight(): void {
    if (documentHeightObserver) return;
    let currentHeight = 0;
    const notify = _.throttle((h: number) => {
        postInteropMessage({ type: "documentHeightChanged", height: h });
    }, 200, { leading: true, trailing: true });
    documentHeightObserver = new ResizeObserver(() => {
        const h = document.documentElement.offsetHeight;
        if (h !== currentHeight) {
            currentHeight = h;
            notify(h);
        }
    });
    documentHeightObserver.observe(document.documentElement);
}
