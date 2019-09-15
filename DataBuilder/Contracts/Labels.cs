using System;
using System.Collections.Generic;
using System.Text;
using Newtonsoft.Json;

namespace WarriorsFamilyTree.DataBuilder.Contracts
{

    public class LabelsRoot
    {

        public IDictionary<string, EntityLabel> Labels { get; set; }

    }

    [JsonConverter(typeof(EntityLabelJsonConverter))]
    public class EntityLabel
    {

        public string Label { get; set; }

        public string Description { get; set; }

    }

    public class EntityLabelJsonConverter : JsonConverter<EntityLabel>
    {

        /// <inheritdoc />
        public override void WriteJson(JsonWriter writer, EntityLabel value, JsonSerializer serializer)
        {
            writer.WriteStartArray();
            writer.WriteValue(value.Label);
            if (value.Description != null)
                writer.WriteValue(value.Description);
            writer.WriteEndArray();
        }

        /// <inheritdoc />
        public override EntityLabel ReadJson(JsonReader reader, Type objectType, EntityLabel existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }

    }
}
