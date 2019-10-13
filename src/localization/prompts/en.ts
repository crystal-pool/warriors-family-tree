const prompts = {
    WelcomeTitle: "Welcome",
    WelcomeDescription: "This is a still work-in-progress automatic family tree for <i>Warriors</i> series. Type something to in the search box below to continue.<br />E.g. type <b>Firestar</b> and press enter.",
    EntitySearchBoxPlaceholder: "Search for a cat…",
    FamilyTreeTitle: "Family tree",
    FamilyTreeTitle1: "Family tree of {0}",
};

export type PromptsTable = typeof prompts;
export type PromptKey = keyof PromptsTable;
export default prompts;
