import { ApplicationInsights, ITelemetryItem } from "@microsoft/applicationinsights-web";

type BacklogEntry = [timestamp: Date, message: string, ...rest: unknown[]];

interface WindowWithBacklog {
    __drainBacklog?(callback: (args: BacklogEntry) => void): void;
}

export const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: environment.aiInstrumentationKey || "",
        disableTelemetry: !environment.isProduction
    }
});

export const telemetryEnvironment = {
    language: ""
};

export function initializeTracking() {
    function processTelemetry(item: ITelemetryItem): boolean {
        if (item.baseType === "PageviewData" && item.baseData) {
            // Allows us to override page title afterwards.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const surrogateProps = item.baseData.properties?._outer_overrides as Record<string, unknown> | undefined;
            if (surrogateProps) {
                Object.assign(item.baseData, surrogateProps);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                delete item.baseData.properties._outer_overrides;
            }
        }
        item.baseData = {
            ...item.baseData,
            properties: {
                environment: {
                    isDevelopment: !environment.isProduction || undefined,
                    buildCommit: environment.commitId,
                    buildTimestamp: environment.buildTimestamp,
                    language: telemetryEnvironment.language
                },
                ...(item.baseData?.properties || {})
            } as unknown
        };
        if (!environment.isProduction) {
            console.log("AI", item);
        }
        return true;
    }
    appInsights.loadAppInsights();
    appInsights.context.application.ver = environment.version;
    appInsights.context.application.build = String(environment.buildTimestamp);
    appInsights.addTelemetryInitializer(processTelemetry);
    appInsights.trackTrace({ message: "Session started." });
    appInsights.trackPageView({});
    if ("__drainBacklog" in window) {
        (window as WindowWithBacklog).__drainBacklog!(args => {
            const [timestamp, message] = args;
            if (message === "_RL") {
                const [, , name, src, success] = args as [Date, string, string, string, boolean];
                const perfEntry = performance
                    .getEntriesByName(src, "resource")
                    .find((e): e is PerformanceResourceTiming => e instanceof PerformanceResourceTiming);
                appInsights.trackDependencyData({
                    id: "resource-loading",
                    name,
                    responseCode: success ? 200 : 0,
                    target: src,
                    duration: perfEntry && Math.round(perfEntry.duration * 1000) / 1000,
                    success,
                    type: "Resource",
                    properties: { originalTimestamp: timestamp.toISOString() }
                });
                return;
            }
            appInsights.trackTrace({ message, properties: { originalTimestamp: timestamp.toISOString(), rest: args.slice(2) } });
        });
        delete (window as WindowWithBacklog).__drainBacklog;
    }
}
