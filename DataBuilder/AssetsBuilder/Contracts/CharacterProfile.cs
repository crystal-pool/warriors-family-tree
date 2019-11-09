using System;
using System.Collections.Generic;
using System.Text;

namespace WarriorsFamilyTree.DataBuilder.Contracts
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

}
