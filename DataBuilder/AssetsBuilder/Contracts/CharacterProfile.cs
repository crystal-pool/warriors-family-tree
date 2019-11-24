using System;
using System.Collections.Generic;
using Newtonsoft.Json;

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

        public IList<CharacterNameEntry>? Names { get; set; }

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

    public class CharacterNameEntry
    {

        // 1 language can have more than 1 names.
        public IList<CharacterLocalizedName> Name { get; set; } = new List<CharacterLocalizedName>();

        // qName
        public string? Since { get; set; }

        // qName
        public string? Until { get; set; }

    }

    [JsonConverter(typeof(CharacterLocalizedNameJsonConverter))]
    public class CharacterLocalizedName
    {

        public string Text { get; set; } = "";

        public string Language { get; set; } = "";

    }

    public class CharacterLocalizedNameJsonConverter : JsonConverter<CharacterLocalizedName>
    {

        /// <inheritdoc />
        public override void WriteJson(JsonWriter writer, CharacterLocalizedName value, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            writer.WriteValue(value.Text);
            writer.WriteValue(value.Language);
            writer.WriteEndArray();
        }

        /// <inheritdoc />
        public override CharacterLocalizedName ReadJson(JsonReader reader, Type objectType, CharacterLocalizedName existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }

    }

}
