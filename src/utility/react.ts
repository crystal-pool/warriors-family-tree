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
    setTitle(title: string, withAppName?: boolean): void;
}

export enum PageTitleContextBits {
    title = 1,
    withAppName = 2,
    setTitle = 4
}

export const PageTitleContext = React.createContext<IPageTitleContextValue>({
    title: document.title,
    withAppName: false,
    setTitle(title) {
        document.title = title;
    }
}, (p, n) => ((p.title !== n.title && PageTitleContextBits.title || 0)
    | (p.withAppName !== n.withAppName && PageTitleContextBits.withAppName || 0)
    | (p.setTitle !== n.setTitle && PageTitleContextBits.setTitle || 0)));

PageTitleContext.displayName = "PageTitleContext";

export function useContextEx<T>(context: React.Context<T>, observedBits?: number | boolean): T {
    const dispatcher = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;
    return dispatcher.useContext(context, observedBits);
}


export function usePageTitle(): string | undefined {
    return useContextEx(PageTitleContext, PageTitleContextBits.title).title;
}

export function useSetPageTitle(): IPageTitleContextValue["setTitle"] {
    return useContextEx(PageTitleContext, PageTitleContextBits.setTitle).setTitle;
}
