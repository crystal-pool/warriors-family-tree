import * as React from "react";

export type TemplateArguments<T> = Record<string, T> | T[];

export function renderTemplate(template: string, args?: TemplateArguments<React.ReactNode>): React.ReactNode {
    if (!args) {
        return template;
    }
    const re = /\{(.+?)\}/g;
    const result: React.ReactNode[] = [];
    while (true) {
        const lastIndex = re.lastIndex;
        const match = re.exec(template);
        if (match) {
            result.push(template.substring(lastIndex, match.index));
            result.push((args as Record<string, React.ReactNode>)[match[1]]);
        } else {
            result.push(template.substring(lastIndex));
            break;
        }
    };
    return result;
}

export function formatTemplate(template: string, args?: TemplateArguments<string>): string {
    return (renderTemplate(template, args) as string[]).join("");
}
