import * as ResizeObserverPolyfill from "resize-observer";
import { delay } from "tasklike-promise-library";

declare global {
    interface Window {
        readonly ResizeObserver: typeof ResizeObserverPolyfill.ResizeObserver;
    }
}

async function smoothScrollTo(element: HTMLElement, x: number, y: number): Promise<void> {
    x = Math.min(x, 0);
    y = Math.min(y, 0);
    const currentLeft = element.scrollLeft;
    const currentTop = element.scrollTop;
    if (x === currentLeft && y === currentTop) return;
    const startTime = performance.now();
    let currentTime = startTime;
    const DURATION = 1000;
    while (true) {
        await delay(50);
        currentTime = performance.now();
        const progress = (currentTime - startTime) / DURATION;
        if (progress > 1) break;
        element.scrollLeft = Math.round(currentLeft * (1 - progress) + x * progress);
        element.scrollTop = Math.round(currentTop * (1 - progress) + y * progress);
    }
    element.scrollLeft = x;
    element.scrollTop = y;
}

function scrollToPolyfill(this: HTMLElement, x: number, y: number): void;
function scrollToPolyfill(this: HTMLElement, options?: ScrollToOptions): void;
function scrollToPolyfill(this: HTMLElement, arg1: ScrollToOptions | number | undefined, arg2?: number): void {
    const x = typeof arg1 === "object" ? arg1.left : arg1;
    const y = typeof arg1 === "object" ? arg1.top : arg2;
    const behavior = typeof arg1 === "object" && arg1.behavior || "smooth";
    if (behavior === "smooth") {
        // tslint:disable-next-line: no-floating-promises
        smoothScrollTo(this, x ?? this.scrollLeft, y ?? this.scrollTop);
    } else {
        if (x != null) this.scrollLeft = x;
        if (y != null) this.scrollTop = y;
    }
}

export function applyPolyfills() {
    if (typeof window.ResizeObserver !== "function") {
        ResizeObserverPolyfill.install();
    }
    if (!HTMLElement.prototype.scrollTo) {
        HTMLElement.prototype.scrollTo = HTMLElement.prototype.scroll || scrollToPolyfill;
    }
}
