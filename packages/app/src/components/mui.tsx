import Menu, { MenuProps } from "@material-ui/core/Menu";
import Tooltip, { TooltipProps } from "@material-ui/core/Tooltip";
import useForkRef from "@material-ui/core/utils/useForkRef";
import * as React from "react";
import { setLogicalParent } from "../utility/featureUsage";

export const LogicallyParentedMenu: React.FC<MenuProps> = React.forwardRef((props, ref) => {
    const localRef = React.useRef<unknown>();
    function updateLogicalParent() {
        if (localRef.current instanceof Element) {
            const { anchorEl } = props;
            setLogicalParent(localRef.current, anchorEl && typeof anchorEl === "function" ? anchorEl(localRef.current) : anchorEl);
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
    const handleMenuRef = useForkRef(updateLocalRef, ref);
    React.useEffect(updateLogicalParent, [props.anchorEl]);
    return (<Menu ref={handleMenuRef} {...props} />);
});

export const LogicallyParentedTooltip: React.FC<TooltipProps> = React.forwardRef((props, ref) => {
    const tooltipRef = React.useRef<unknown>();
    const popperDivRef = React.useRef<HTMLElement>();
    const handleTooltipRef = useForkRef(tooltipRef, ref);
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
    // Somehow MUI does not expose popper.ref in TS.
    return (<Tooltip ref={handleTooltipRef} {...props} PopperProps={{...props.PopperProps, ref: updatePopperRef} as {}} />);
});
