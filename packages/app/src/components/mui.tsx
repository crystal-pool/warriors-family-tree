import Menu, { MenuProps } from "@mui/material/Menu";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import * as React from "react";
import { setLogicalParent } from "../utility/featureUsage";

export const LogicallyParentedMenu = React.forwardRef<HTMLDivElement, MenuProps>((props, ref) => {
    const localRef = React.useRef<unknown>();
    function updateLogicalParent() {
        if (localRef.current instanceof Element) {
            const { anchorEl } = props;
            const resolved = anchorEl && typeof anchorEl === "function" ? (anchorEl as (el: Element) => Element)(localRef.current as Element) : anchorEl;
            setLogicalParent(localRef.current, resolved instanceof Element ? resolved : undefined);
        }
    }
    function updateLocalRef(e: unknown) {
        if (localRef.current === e) return;
        if (localRef.current instanceof Element) {
            setLogicalParent(localRef.current);
        }
        localRef.current = e;
        updateLogicalParent();
    }
    const handleMenuRef = React.useCallback((node: HTMLDivElement | null) => {
        updateLocalRef(node);
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }, [ref]);
    React.useEffect(updateLogicalParent, [props.anchorEl]);
    return (<Menu ref={handleMenuRef} {...props} />);
});

export const LogicallyParentedTooltip = React.forwardRef<unknown, TooltipProps>((props, ref) => {
    const tooltipRef = React.useRef<unknown>();
    const popperDivRef = React.useRef<HTMLElement>();
    const handleTooltipRef = React.useCallback((node: unknown) => {
        tooltipRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<unknown>).current = node;
    }, [ref]);
    function updateLogicalParent() {
        if (popperDivRef.current instanceof Element) {
            setLogicalParent(popperDivRef.current, tooltipRef.current instanceof Element ? tooltipRef.current : undefined);
        }
    }
    function updatePopperRef(e: HTMLElement) {
        if (popperDivRef.current !== e) {
            if (popperDivRef.current instanceof Element) {
                setLogicalParent(popperDivRef.current);
            }
            popperDivRef.current = e;
            updateLogicalParent();
        }
    }
    React.useEffect(updateLogicalParent, [props.children]);
    return (<Tooltip ref={handleTooltipRef} {...props} slotProps={{...props.slotProps, popper: {...(props.slotProps?.popper ?? {}), ref: updatePopperRef} as {}}} />);
});
