/**
 * This is the fallback scss module that makes ForkTsCheckerWebpackPlugin happy.
 * typings-for-css-modules-loader is not generating .d.ts files early enough.
 */
declare module "*.scss" {
    const classNames: Record<string, string>;
    export default classNames;
}

// @material-ui/icons v4.11.2 misses the typedef.
declare module "@material-ui/icons/utils/createSvgIcon" {
    import type SvgIcon from "@material-ui/core/SvgIcon";
    export default function createSvgIcon(path: React.ReactNode, displayName: string): typeof SvgIcon;
}
