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
}
