export interface IInteropMessageBase {
    type: string;
    token?: string;
}

export interface IInitializeMessage extends IInteropMessageBase {
    type: "initialize";
    url?: string;
    revision: string;
    buildTimestamp: number;
    settings?: IHostSettings;
}

export interface IHostSettings {
    observeDocumentHeight?: boolean;
    scrollable?: boolean;
    onFamilyTreeNodeClick?: "none" | "default";
    backgroundColor?: string;
}

export interface IEmbedReadyMessage extends IInteropMessageBase {
    type: "ready";
    revision: string;
    buildTimestamp: number;
}

export interface IEmbedDocumentHeightChangedMessage extends IInteropMessageBase {
    type: "documentHeightChanged";
    height: number;
}

export interface IEmbedFamilyTreeNodeClickMessage extends IInteropMessageBase {
    type: "familyTreeNodeClick";
    qName: string;
}

export type HostMessage = IInitializeMessage;
export type EmbedMessage = IEmbedReadyMessage | IEmbedDocumentHeightChangedMessage | IEmbedFamilyTreeNodeClickMessage;

export function isInteropMessage(data: unknown): data is IInteropMessageBase {
    if (!data || typeof data !== "object") return false;
    return typeof (data as Record<string, unknown>).type === "string";
}
