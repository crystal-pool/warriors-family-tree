using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder.Contracts;

public class TimelineRoot
{

    // <EntityId, MarkerInfo>
    public IDictionary<string, TimelineMarkerInfo> Markers { get; set; } = new Dictionary<string, TimelineMarkerInfo>();

}

[JsonConverter(typeof(TimelineMarkerInfoJsonConverter))]
public class TimelineMarkerInfo
{

    public string TimelineName { get; set; } = "";

    public int Month { get; set; }

}

public class TimelineMarkerInfoJsonConverter : JsonConverter<TimelineMarkerInfo>
{

    public override TimelineMarkerInfo? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        throw new NotSupportedException();
    }

    public override void Write(Utf8JsonWriter writer, TimelineMarkerInfo value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.TimelineName);
        writer.WriteNumberValue(value.Month);
        writer.WriteEndArray();
    }

}
