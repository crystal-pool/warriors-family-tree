using System.Collections.Generic;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder.Contracts
{

    public class CharacterProfileRoot
    {

        public IDictionary<string, CharacterProfileEntry> Characters = new Dictionary<string, CharacterProfileEntry>();

    }

    public class CharacterProfileEntry
    {

        // male/female
        public string? Gender { get; set; }

        public IList<CharacterAffiliationEntry>? Affiliations { get; set; }

        public IList<CharacterPositionEntry>? PositionsHeld { get; set; }

    }

    public class CharacterAffiliationEntry
    {

        // qName
        public string Group { get; set; } = "";

        // qName
        public string? Since { get; set; }

        // qName
        public string? Until { get; set; }

    }

    public class CharacterPositionEntry
    {

        // qName
        public string Position { get; set; } = "";

        // qName
        public string? Of { get; set; }

        // qName
        public string? Since { get; set; }

        // qName
        public string? Until { get; set; }

    }

}
