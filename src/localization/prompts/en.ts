const prompts = {
    AboutThisApp: "About this app",
    AboutThisAppDescription: "Or provide feedback to us",
    CharacterApprentice: "Apprentice",
    CharacterApprentices: "Apprentices",
    CharacterChild: "Child",
    CharacterChildren: "Children",
    CharacterMate: "Mate",
    CharacterMates: "Mates",
    CharacterMentor: "Mentor",
    CharacterMentors: "Mentors",
    CharacterParent: "Parent",
    CharacterParents: "Parents",
    ContributeToTheDataSource: "Contribute to the data source",
    EmbedAppMenu: "Click to see more actions",
    EmbedPoweredBy1: "Powered by {0}",
    EntitySearchBoxPlaceholder: "Search for a cat…",
    FamilyTreeTitle: "Family tree",
    FamilyTreeTitle1: "Family tree of {0}",
    InitializationDescription: "Hold tight. We are still loading some data.",
    InitializationTitle: "Initializing…",
    ListSeparator: ", ",
    OpenInNewWindow: "Open in new window",
    StarTheRepo: "Star the repo ⭐",
    SwitchLanguage: "Switch language / 語言",
    WelcomeDescription: "This is a still work-in-progress automatic family tree for <i>Warriors</i> series. Type something to in the search box below to continue.<br />E.g. type <b>Firestar</b> and press enter.",
    WelcomeTitle: "Welcome",
};

export type PromptsTable = typeof prompts;
export type PromptKey = keyof PromptsTable;
export default prompts;