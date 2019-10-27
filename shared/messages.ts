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
