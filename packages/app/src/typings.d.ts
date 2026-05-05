/**
 * CSS modules type declaration for *.module.scss files.
 * Vite handles CSS modules natively for files matching *.module.scss.
 */
declare module "*.module.scss" {
    const classNames: Record<string, string>;
    export default classNames;
}
