import { SeverityLevel } from "@microsoft/applicationinsights-web";
import { appInsights } from "./telemetry";

export function trackFeatureUsage(featureName: string, featureLocation?: string, usageContext?: Record<string, any>) {
    appInsights.trackEvent({
        name: "featureUsage",
        properties: {
            featureName,
            featureLocation,
            usageContext
        }
    });
}

export interface IFeatureDataProps {
    ["data-f1"]?: string | null;
    ["data-f2"]?: string | null;
}

export function buildFeatureAnchorProps(featureName: string, usageContext?: Record<string, any>): IFeatureDataProps {
    if (!featureName) throw new RangeError("Expect non-empty featureName.");
    return { "data-f1": JSON.stringify([featureName, usageContext]) };
}

export function buildUiScopeProps(scopeName: string): IFeatureDataProps {
    return { "data-f2": scopeName };
}

export function trackFeatureUsageFromElement(element: Element): boolean {
    const scopes: string[] = [];
    let featureName: string | undefined;
    let usageContext: Record<string, any> | undefined;
    for (let currentElement: Element | null = element; currentElement; currentElement = currentElement.parentElement) {
        const featureData: IFeatureDataProps = {
            "data-f1": currentElement.getAttribute("data-f1"),
            "data-f2": currentElement.getAttribute("data-f2"),
        };
        if (featureData["data-f1"]) {
            const [fn, uc] = JSON.parse(featureData["data-f1"]);
            if (featureName == null) {
                featureName = fn;
                usageContext = uc;
            } else {
                appInsights.trackTrace({
                    message: "Detected nested f1 prop. Ignored outer one.",
                    severityLevel: SeverityLevel.Warning,
                    properties: {
                        featureName1: featureName,
                        usageContext1: usageContext,
                        featureName2: fn,
                        usageContext2: uc,
                    }
                });
            }
        }
        if (currentElement instanceof HTMLAnchorElement && currentElement.href) {
            if (featureName == null) featureName = "navigation.link";
            usageContext = usageContext || {};
            if (!("href" in usageContext)) usageContext.href = currentElement.href;
        }
        if (featureData["data-f2"]) {
            if (featureName == null) return false;
            scopes.push(featureData["data-f2"]);
        }
    }
    if (featureName == null) return false;
    scopes.push("ui");
    scopes.reverse();
    trackFeatureUsage(featureName, scopes.join("/"), usageContext);
    return true;
}
