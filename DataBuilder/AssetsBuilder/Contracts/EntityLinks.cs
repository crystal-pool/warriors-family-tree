using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

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

    public override EntityLink? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException();
    }

    public override void Write(Utf8JsonWriter writer, EntityLink value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.Link);
        writer.WriteStringValue(value.Site);
        if (value.Name != null) writer.WriteStringValue(value.Name);
        writer.WriteEndArray();
    }

}
