import * as React from "react";

export function usePrevious<T>(nextValue: T, initialValue?: undefined): T | undefined;
export function usePrevious<T, TInit = T>(nextValue: T, initialValue: TInit): T | TInit;
export function usePrevious<T, TInit>(nextValue: T, initialValue: TInit): T | TInit {
    const ref = React.useRef<T | TInit>(initialValue);
    React.useEffect(() => {
        ref.current = nextValue;
    });
    return ref.current;
}

export interface IPageTitleContextValue {
    title?: string;
    withAppName: boolean;
    setTitle: (title: string, withAppName?: boolean) => void;
}

export const PageTitleContext = React.createContext<IPageTitleContextValue>({
    title: document.title,
    withAppName: false,
    setTitle(title) {
        document.title = title;
    }
});

PageTitleContext.displayName = "PageTitleContext";

export function usePageTitle(): string | undefined {
    return React.useContext(PageTitleContext).title;
}

export function useSetPageTitle(): IPageTitleContextValue["setTitle"] {
    return React.useContext(PageTitleContext).setTitle;
}

export function shallowEquals(objA: unknown, objB: unknown): boolean {
    if (objA === objB) return true;
    if (typeof objA !== typeof objB) return false;
    if (objA === null) {
        return objB === null;
    } else if (objB === null) {
        return false;
    }
    switch (typeof objA) {
        case "object":
            if (Array.isArray(objA)) {
                if (!Array.isArray(objB)) return false;
                if (objA.length !== objB.length) return false;
                return objA.every((v, i) => objB[i] === v);
            } else if (Array.isArray(objB)) {
                return false;
            }
            {
                const keysA = Object.keys(objA);
                const keysB = Object.keys(objB as object);
                if (keysA.length !== keysB.length) return false;
                return keysA.every(k => (objA as Record<string, unknown>)[k] === (objB as Record<string, unknown>)[k]);
            }
        default:
            // We've excluded objA === objB case.
            return false;
    }
}
