import { dataService } from "../services";
import { CharacterTimelineBuilder } from "./characterTimeline";

export { CharacterTimelineBuilder } from "./characterTimeline";

export const characterTimelineBuilder = new CharacterTimelineBuilder(dataService);
