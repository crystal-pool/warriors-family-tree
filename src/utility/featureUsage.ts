import { SeverityLevel } from "@microsoft/applicationinsights-web";
import { hashString } from "./general";
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

interface ILogicallyParentedDomElementProps {
    _l_f_owner?: Element;
}

export function setLogicalParent(element: Element, parent?: Element | null): void {
    if (parent) {
        (element as ILogicallyParentedDomElementProps)._l_f_owner = parent;
    } else {
        delete (element as ILogicallyParentedDomElementProps)._l_f_owner;
    }
}

export function getLogicalParent(element: Element): Element | null {
    return (element as ILogicallyParentedDomElementProps)._l_f_owner || element.parentElement || null;
}

export interface IFeatureDataProps {
    ["data-f1"]?: string | null;
    ["data-f3"]?: string | null;
    ["data-f2"]?: string | null;
}

const featureAnchorIntegritySalt = Math.round(Math.random() * 1677216);

export function buildFeatureAnchorProps(featureName: string, usageContext?: Record<string, any>): IFeatureDataProps {
    if (!featureName) throw new RangeError("Expect non-empty featureName.");
    const rawValue = JSON.stringify([featureName, usageContext]);
    const integrity = (hashString(rawValue) ^ featureAnchorIntegritySalt).toString(36);
    return { "data-f1": rawValue, "data-f3": integrity };
}

export function buildUiScopeProps(scopeName: string): IFeatureDataProps {
    return { "data-f2": scopeName };
}

export function checkFeatureAnchorIntegrity(props: IFeatureDataProps): boolean {
    if (props["data-f1"]) {
        if (!props["data-f3"]) return false;
        const rawValue = props["data-f1"];
        const integrity = (hashString(rawValue) ^ featureAnchorIntegritySalt).toString(36);
        return props["data-f3"] === integrity;
    }
    return true;
}

export function trackFeatureUsageFromElement(element: Element): boolean {
    const scopes: string[] = [];
    let featureName: string | undefined;
    let usageContext: Record<string, any> | undefined;
    for (let currentElement: Element | null = element; currentElement; currentElement = getLogicalParent(currentElement)) {
        const featureData: IFeatureDataProps = {
            "data-f1": currentElement.getAttribute("data-f1"),
            "data-f2": currentElement.getAttribute("data-f2"),
            "data-f3": currentElement.getAttribute("data-f3"),
        };
        if (!checkFeatureAnchorIntegrity(featureData)) {
            return false;
        }
        if (featureData["data-f2"]) {
            if (featureName) scopes.push(featureData["data-f2"]);
            // Seen a ui scope, but not seen any feature yet.
            else if (!featureData["data-f1"]) return false;
        }
        if (featureData["data-f1"]) {
            const [fn, uc] = JSON.parse(featureData["data-f1"]);
            if (featureName == null) {
                featureName = fn;
                usageContext = uc;
            } else {
                // Usually the case when a logically parented popup menu item has been clicked.
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
            if (!("htmlAnchor" in usageContext)) {
                usageContext.htmlAnchor = {
                    href: currentElement.href,
                    target: currentElement.target
                };
            }
        }
    }
    if (featureName == null) return false;
    scopes.push("ui");
    scopes.reverse();
    trackFeatureUsage(featureName, scopes.join("/"), usageContext);
    return true;
}
