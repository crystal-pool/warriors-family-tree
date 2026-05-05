import * as React from "react";

export type TemplateArguments<T> = Record<string, T> | T[];

export function renderTemplate(template: string, args?: TemplateArguments<React.ReactNode>): React.ReactNode {
    if (!args) {
        return template;
    }
    let re = /\{(.+?)\}/g;
    const result: React.ReactNodeArray = [];
    do {
        const lastIndex = re.lastIndex;
        const match = re.exec(template);
        if (match) {
            result.push(template.substring(lastIndex, match.index));
            result.push((args as any)[match[1]]);
        } else {
            result.push(template.substring(lastIndex));
            break;
        }
    } while (true);
    return result;
}

export function formatTemplate(template: string, args?: TemplateArguments<string>): string {
    return (renderTemplate(template, args) as string[]).join("");
}
