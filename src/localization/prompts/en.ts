const prompts = {
    StarTheRepo: "Star the repo ⭐",
    ContributeToTheDataSource: "Contribute to the data source",
    InitializationTitle: "Initializing…",
    InitializationDescription: "Hold tight. We are still loading some data.",
    WelcomeTitle: "Welcome",
    WelcomeDescription: "This is a still work-in-progress automatic family tree for <i>Warriors</i> series. Type something to in the search box below to continue.<br />E.g. type <b>Firestar</b> and press enter.",
    EntitySearchBoxPlaceholder: "Search for a cat…",
    SwitchLanguage: "Switch language / 語言",
    FamilyTreeTitle: "Family tree",
    FamilyTreeTitle1: "Family tree of {0}",
    CharacterParent: "Parent",
    CharacterParents: "Parents",
    CharacterMate: "Mate",
    CharacterMates: "Mates",
    CharacterChild: "Child",
    CharacterChildren: "Children",
    CharacterMentor: "Mentor",
    CharacterMentors: "Mentors",
    CharacterApprentice: "Apprentice",
    CharacterApprentices: "Apprentices",
    ListSeparator: ", ",
};

export type PromptsTable = typeof prompts;
export type PromptKey = keyof PromptsTable;
export default prompts;
