using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder.Contracts;

public class CharacterProfileRoot
{

    public required IDictionary<string, CharacterProfileEntry> Characters { get; set; }

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

    public override CharacterLocalizedName? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException();
    }

    public override void Write(Utf8JsonWriter writer, CharacterLocalizedName value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.Text);
        writer.WriteStringValue(value.Language);
        writer.WriteEndArray();
    }

}
