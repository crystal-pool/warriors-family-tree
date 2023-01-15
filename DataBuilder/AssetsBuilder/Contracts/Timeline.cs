using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;

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

    /// <inheritdoc />
    public override void WriteJson(JsonWriter writer, TimelineMarkerInfo? value, JsonSerializer serializer)
    {
        if (value == null)
        {
            writer.WriteNull();
            return;
        }
        writer.WriteStartArray();
        writer.WriteValue(value.TimelineName);
        writer.WriteValue(value.Month);
        writer.WriteEndArray();
    }

    /// <inheritdoc />
    public override TimelineMarkerInfo ReadJson(JsonReader reader, Type objectType, TimelineMarkerInfo? existingValue, bool hasExistingValue, JsonSerializer serializer)
    {
        throw new NotSupportedException();
    }

}
