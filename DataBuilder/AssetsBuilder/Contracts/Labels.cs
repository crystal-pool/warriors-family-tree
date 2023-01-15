using System;
using System.Collections.Generic;
using Newtonsoft.Json;

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

    /// <inheritdoc />
    public override void WriteJson(JsonWriter writer, EntityLabel? value, JsonSerializer serializer)
    {
        if (value == null)
        {
            writer.WriteNull();
            return;
        }
        writer.WriteStartArray();
        writer.WriteValue(value.Label);
        if (value.Description != null)
            writer.WriteValue(value.Description);
        writer.WriteEndArray();
    }

    /// <inheritdoc />
    public override EntityLabel ReadJson(JsonReader reader, Type objectType, EntityLabel? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        throw new NotSupportedException();
    }

}
