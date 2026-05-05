using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder.Contracts;

public class LabelsRoot
{

    public IDictionary<string, EntityLabel> Labels { get; set; } = new Dictionary<string, EntityLabel>();

}

[JsonConverter(typeof(EntityLabelJsonConverter))]
public class EntityLabel
{

    public string Label { get; set; } = "";

    public string? Description { get; set; }

}

public class EntityLabelJsonConverter : JsonConverter<EntityLabel>
{

    public override EntityLabel? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException();
    }

    public override void Write(Utf8JsonWriter writer, EntityLabel value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.Label);
        if (value.Description != null)
            writer.WriteStringValue(value.Description);
        writer.WriteEndArray();
    }

}
