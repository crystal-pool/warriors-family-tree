export interface IEnvironmentInfo {
    isProduction: boolean;
    commitId: string;
    buildTimestamp: number;
}

declare global {
    /**
     * Retrospective build environment information.
     */
    export const environment: IEnvironmentInfo;
}
