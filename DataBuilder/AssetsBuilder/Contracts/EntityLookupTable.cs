using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder.Contracts;

public class EntityLookupTableRoot
{

    public IList<EntityLookupKeywordEntry> Entries { get; set; } = new List<EntityLookupKeywordEntry>();

}

[JsonConverter(typeof(EntityLookupKeywordEntryJsonConverter))]
public class EntityLookupKeywordEntry
{

    public string Keyword { get; set; } = "";

    public IList<EntityLookupEntityEntry> Entities { get; set; } = new List<EntityLookupEntityEntry>();

}

[JsonConverter(typeof(EntityLookupEntityEntryJsonConverter))]
public class EntityLookupEntityEntry
{

    public string QName { get; set; } = "";

    public string Language { get; set; } = "";

    public int Priority { get; set; }

}

public class EntityLookupKeywordEntryJsonConverter : JsonConverter<EntityLookupKeywordEntry>
{

    public override EntityLookupKeywordEntry? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException();
    }

    public override void Write(Utf8JsonWriter writer, EntityLookupKeywordEntry value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.Keyword);
        JsonSerializer.Serialize(writer, value.Entities, options);
        writer.WriteEndArray();
    }

}

public class EntityLookupEntityEntryJsonConverter : JsonConverter<EntityLookupEntityEntry>
{

    public override EntityLookupEntityEntry? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException();
    }

    public override void Write(Utf8JsonWriter writer, EntityLookupEntityEntry value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.QName);
        writer.WriteStringValue(value.Language);
        writer.WriteNumberValue(value.Priority);
        writer.WriteEndArray();
    }

}