import { ApplicationInsights, ITelemetryItem } from "@microsoft/applicationinsights-web";

export const appInsights = new ApplicationInsights({
    config: {
        instrumentationKey: environment.aiInstrumentationKey || "",
        disableTelemetry: !environment.isProduction
    }
});

export function initializeTracking() {
    function processTelemetry(item: ITelemetryItem): boolean {
        item.tags = item.tags || [];
        environment.isProduction || (item.tags["wft.isDevelopment"] = true);
        item.tags["wft.buildCommit"] = environment.commitId;
        item.tags["wft.buildTimestamp"] = environment.buildTimestamp;
        if (!environment.isProduction) {
            console.log("AI", item);
            return false;
        }
        return true;
    }
    appInsights.loadAppInsights();
    appInsights.addTelemetryInitializer(processTelemetry);
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
                })
                return;
            }
            appInsights.trackTrace({ message, properties: { originalTimestamp: timestamp.toISOString(), rest } });
        });
    }
}