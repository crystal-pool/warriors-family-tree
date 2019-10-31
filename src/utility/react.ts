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
