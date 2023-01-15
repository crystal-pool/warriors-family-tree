using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder.Contracts;

public class EntityLinksRoot
{

    // <QName, Link[]>
    public IDictionary<string, IList<EntityLink>> Links { get; set; } = new Dictionary<string, IList<EntityLink>>();

}

[JsonConverter(typeof(EntityLinkJsonConverter))]
public class EntityLink
{

    public string Link { get; set; } = "";

    public string Site { get; set; } = "";

    public string? Name { get; set; }

}

public class EntityLinkJsonConverter : JsonConverter<EntityLink>
{

    /// <inheritdoc />
    public override void WriteJson(JsonWriter writer, EntityLink? value, JsonSerializer serializer)
    {
        if (value == null)
        {
            writer.WriteNull();
            return;
        }
        writer.WriteStartArray();
        writer.WriteValue(value.Link);
        writer.WriteValue(value.Site);
        if (value.Name != null) writer.WriteValue(value.Name);
        writer.WriteEndArray();
    }

    /// <inheritdoc />
    public override EntityLink ReadJson(JsonReader reader, Type objectType, EntityLink? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        throw new NotSupportedException();
    }

}
