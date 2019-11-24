const prompts = {
    AboutThisApp: "About this app",
    AboutThisAppDescription: "Or provide feedback to us",
    AffiliationsTitle: "Affiliations",
    Brackets: "({0})",
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
    DurationMoon: "moon",       // Clan cats' concept of "month"
    DurationMoons: "moons",
    DurationYear: "year",
    DurationYears: "years",
    EmbedAppMenu: "Click to see more actions",
    EmbedPoweredBy1: "Powered by {0}",
    EntityNotFound1: "No more information available for the entity: {0}.",
    EntityProfileTitle: "Entity profile",
    EntitySearchBoxPlaceholder: "Search for a cat…",
    FamilyTreeTitle: "Family tree",
    FamilyTreeTitle1: "Family tree of {0}",
    GoToEntityDataSource: "Go to data source of this entity.",
    HoweverCheckout1: "However, you can check if there is something on {0}.",
    InitializationDescription: "Hold tight. We are still loading some data.",
    InitializationTitle: "Initializing…",
    ListSeparator: ", ",
    MissingTimelineInformation: "Missing timeline information.",
    More: "More",
    NamesTitle: "Names",
    NoFamilyTreeInformation: "No family tree information.",
    OpenInNewWindow: "Open in new window",
    PageNeedsEntityId: "This page needs an entity ID as parameter.",
    PositionsHeldTitle: "Positions held",
    RelationsTitle: "Relations",
    StarTheRepo: "Star the repo ⭐",
    SwitchLanguage: "Switch language / 語言",
    TimelineUntilNow: "Now",
    WelcomeDescription: "This is a still work-in-progress automatic family tree for <i>Warriors</i> series. Type something to in the search box below to continue.<br />E.g. type <b>Firestar</b> and press enter.",
    WelcomeTitle: "Welcome",
};

export type PromptsTable = typeof prompts;
export type PromptKey = keyof PromptsTable;
export default prompts;
