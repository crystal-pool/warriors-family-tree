import { DataService, RdfQName, TimelineName } from "../services/dataService";
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

export interface ITimelineAffiliationEvent extends ITimelineEventBase {
    type: "affiliation";
    group: RdfQName;
}

export type TimelineEvent = ITimelineAffiliationEvent;

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
    public timelineTimeFromMarker(markerEntityId: RdfQName, offsetMonths?: number): TimelineTime | undefined {
        if (isBlankNodeUri(markerEntityId)) return "unknown";
        const marker = this._dataService.getTimelineMarker(markerEntityId);
        if (!marker) return undefined;
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
}
