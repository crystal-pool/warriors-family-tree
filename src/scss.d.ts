/**
 * This is the fallback scss module that makes ForkTsCheckerWebpackPlugin happy.
 * typings-for-css-modules-loader is not generating .d.ts files early enough.
 */
declare module "*.scss" {
    const classNames: Record<string, string>;
    export default classNames;
}
