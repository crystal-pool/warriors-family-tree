import { CharacterRelationType, DataService, RdfQName, TimelineName } from "../services/dataService";
import { isBlankNodeUri } from "../utility/rdf";

export interface ITimelineTimeValue {
    marker: RdfQName;
    offsetMonths?: number;
    timeline: TimelineName;
    absoluteMonths: number;
}

export type TimelineTime = ITimelineTimeValue | "unknown";

export interface ITimelineEventBase {
    type: string;
    startTime?: TimelineTime;
    endTime?: TimelineTime;
    isCurrent?: boolean;
}

export interface ITimelineRelationEvent extends ITimelineEventBase {
    type: "relation";
    relation: CharacterRelationType;
    target: RdfQName;
}

export interface ITimelineAffiliationEvent extends ITimelineEventBase {
    type: "affiliation";
    group: RdfQName;
}

export interface ITimelinePositionHoldingEvent extends ITimelineEventBase {
    type: "position-holding";
    position: RdfQName;
    of?: RdfQName;
}

export interface ITimelineNamingEvent extends ITimelineEventBase {
    type: "naming";
    // [text, language][]
    names: readonly [string, string][];
}

export type TimelineEvent = ITimelineRelationEvent | ITimelineAffiliationEvent | ITimelinePositionHoldingEvent | ITimelineNamingEvent;

const timelineOrdinal: Record<TimelineName, number> = {
    dotc: 0,
    modern: 1
};

export function compareTimelineTime(x?: TimelineTime, y?: TimelineTime): -1 | 0 | 1 {
    if (x === y) return 0;
    if (x == null) return -1;
    if (x === "unknown") return y == null ? -1 : 1;
    if (y == null || y === "unknown") return 1;
    if (x.timeline !== y.timeline) return timelineOrdinal[x.timeline] > timelineOrdinal[y.timeline] ? 1 : -1;
    if (x.absoluteMonths > y.absoluteMonths) return 1;
    if (x.absoluteMonths === y.absoluteMonths) return 0;
    return -1;
}

export class CharacterTimelineBuilder {
    constructor(private _dataService: DataService) {
    }
    public timelineTimeFromMarker(markerEntityId: RdfQName, offsetMonths?: number): TimelineTime {
        if (isBlankNodeUri(markerEntityId)) return "unknown";
        const marker = this._dataService.getTimelineMarker(markerEntityId);
        if (!marker) {
            console.warn("Cannot find timeline information for marker: ", markerEntityId);
            return "unknown";
        }
        return {
            marker: markerEntityId,
            offsetMonths: offsetMonths,
            timeline: marker.timeline,
            absoluteMonths: marker.totalMonths + (offsetMonths || 0)
        };
    }
    private _sortAndFill(events: ITimelineEventBase[]): void {
        events.sort((x, y) => {
            const s = compareTimelineTime(x.startTime, y.startTime);
            if (s !== 0) return s;
            return compareTimelineTime(y.startTime, y.endTime);
        });
        for (const e of events) {
            if (e.endTime == null) {
                e.isCurrent = true;
            }
        }
    }
    public getRelations(entityId: RdfQName, relationType?: CharacterRelationType | Iterable<CharacterRelationType>, currentOnly?: boolean): ITimelineRelationEvent[] {
        let rawRel = this._dataService.getRelationsFor(entityId, relationType);
        if (!rawRel) return [];
        if (currentOnly) rawRel = rawRel.filter(a => a.until == null);
        const rel = rawRel.map<ITimelineRelationEvent>(a => ({
            type: "relation",
            startTime: a.since != null ? this.timelineTimeFromMarker(a.since) : undefined,
            endTime: a.until != null ? this.timelineTimeFromMarker(a.until) : undefined,
            relation: a.relation,
            target: a.target
        }));
        this._sortAndFill(rel);
        return rel;
    }
    public getAffiliations(entityId: RdfQName, currentOnly?: boolean): ITimelineAffiliationEvent[] {
        let rawAff = this._dataService.getCharacterProfileFor(entityId)?.affiliations;
        if (!rawAff) return [];
        if (currentOnly) rawAff = rawAff.filter(a => a.until == null);
        const aff = rawAff.map<ITimelineAffiliationEvent>(a => ({
            type: "affiliation",
            startTime: a.since != null ? this.timelineTimeFromMarker(a.since) : undefined,
            endTime: a.until != null ? this.timelineTimeFromMarker(a.until) : undefined,
            group: a.group
        }));
        this._sortAndFill(aff);
        return aff;
    }
    public getPositionsHeld(entityId: RdfQName, currentOnly?: boolean): ITimelinePositionHoldingEvent[] {
        let rawPos = this._dataService.getCharacterProfileFor(entityId)?.positionsHeld;
        if (!rawPos) return [];
        if (currentOnly) rawPos = rawPos.filter(a => a.until == null);
        const pos = rawPos.map<ITimelinePositionHoldingEvent>(a => ({
            type: "position-holding",
            startTime: a.since != null ? this.timelineTimeFromMarker(a.since) : undefined,
            endTime: a.until != null ? this.timelineTimeFromMarker(a.until) : undefined,
            position: a.position,
            of: a.of
        }));
        this._sortAndFill(pos);
        return pos;
    }
    public getNames(entityId: RdfQName, currentOnly?: boolean): ITimelineNamingEvent[] {
        let rawNames = this._dataService.getCharacterProfileFor(entityId)?.names;
        if (!rawNames) return [];
        if (currentOnly) rawNames = rawNames.filter(a => a.until == null);
        const pos = rawNames.map<ITimelineNamingEvent>(a => ({
            type: "naming",
            startTime: a.since != null ? this.timelineTimeFromMarker(a.since) : undefined,
            endTime: a.until != null ? this.timelineTimeFromMarker(a.until) : undefined,
            names: a.name
        }));
        this._sortAndFill(pos);
        return pos;
    }
}
