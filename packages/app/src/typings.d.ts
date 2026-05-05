/**
 * CSS modules type declaration for *.module.scss files.
 * Vite handles CSS modules natively for files matching *.module.scss.
 */
declare module "*.module.scss" {
    const classNames: Record<string, string>;
    export default classNames;
}

// @material-ui/icons v4.11.2 misses the typedef.
declare module "@material-ui/icons/utils/createSvgIcon" {
    import type SvgIcon from "@material-ui/core/SvgIcon";
    export default function createSvgIcon(path: React.ReactNode, displayName: string): typeof SvgIcon;
}
