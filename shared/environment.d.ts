export interface IEnvironmentInfo {
    isProduction: boolean;
    version: string;
    commitId: string;
    buildTimestamp: number;
    aiInstrumentationKey?: string;
}

declare global {
    /**
     * Retrospective build environment information.
     */
    export const environment: IEnvironmentInfo;
}
