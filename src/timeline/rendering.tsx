import * as React from "react";
import { RdfEntityLabel } from "../components/RdfEntity";
import { resourceManager } from "../localization";
import { TimelineTime } from "./characterTimeline";

export interface ITimelineTimeLabelProps {
    time: TimelineTime;
}

export const TimelineTimeLabel: React.FC<ITimelineTimeLabelProps> = function TimelineTimeLabel(props): React.ReactElement {
    const { time } = props;
    if (time === "unknown") return <>??</>;
    if (time.offsetMonths) {
        const prefix = time.offsetMonths >= 0 ? "+" : "-";
        const unit = resourceManager.getPrompt(time.offsetMonths <= 1 ? "DurationMoon" : "DurationMoons");
        return (<><RdfEntityLabel qName={time.marker} />{resourceManager.getPrompt("Brackets", [prefix + Math.abs(time.offsetMonths) + unit])}</>);
    }
    return <RdfEntityLabel qName={time.marker} />;
};

export interface ITimelineTimeRangeLabelProps {
    time1?: TimelineTime;
    time2?: TimelineTime;
}

export const TimelineTimeRangeLabel: React.FC<ITimelineTimeRangeLabelProps> = function TimelineTimeRangeLabel(props): React.ReactElement {
    const { time1, time2 } = props;
    return (<>
        {time1 && <TimelineTimeLabel time={time1} />}
        &mdash;
        {time2 ? <TimelineTimeLabel time={time2} /> : resourceManager.getPrompt("TimelineUntilNow")}
    </>);
};
