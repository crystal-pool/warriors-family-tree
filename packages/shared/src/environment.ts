export interface IEnvironmentInfo {
    isProduction: boolean;
    version: string;
    commitId: string;
    buildTimestamp: number;
}

declare global {
    /**
     * Retrospective build environment information.
     */
    const environment: IEnvironmentInfo;
}
