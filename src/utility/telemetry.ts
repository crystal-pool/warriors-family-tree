import { ApplicationInsights, ITelemetryItem } from "@microsoft/applicationinsights-web";

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
            const surrogateName = item.baseData.properties && item.baseData.properties._name;
            if (surrogateName) {
                item.baseData.name = surrogateName;
                delete item.baseData.properties._name;
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
                ...(item.baseData && item.baseData.properties || {})
            }
        };
        if (!environment.isProduction) {
            console.log("AI", item);
        }
        return true;
    }
    appInsights.loadAppInsights();
    appInsights.context.application.ver = environment.commitId;
    appInsights.context.application.build = String(environment.buildTimestamp);
    appInsights.addTelemetryInitializer(processTelemetry);
    appInsights.trackTrace({ message: "Session started." });
    appInsights.trackPageView({});
    if ("__drainBacklog" in window) {
        (window as any).__drainBacklog(function (args: [Date, string, ...any[]]) {
            const [timestamp, message, ...rest] = args;
            if (message === "_RL") {
                const [, , name, src, success] = args;
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
            appInsights.trackTrace({ message, properties: { originalTimestamp: timestamp.toISOString(), rest } });
        });
    }
}
