import * as ResizeObserverPolyfill from "resize-observer";

declare global {
    interface Window {
        readonly ResizeObserver: typeof ResizeObserverPolyfill.ResizeObserver;
    }
}

export function applyPolyfills() {
    if (typeof window.ResizeObserver !== "function") {
        ResizeObserverPolyfill.install();
    }
}
