using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder.Contracts
{

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

        /// <inheritdoc />
        public override void WriteJson(JsonWriter writer, EntityLookupKeywordEntry? value, JsonSerializer serializer)
        {
            if (value == null)
            {
                writer.WriteNull();
                return;
            }
            writer.WriteStartArray();
            writer.WriteValue(value.Keyword);
            serializer.Serialize(writer, value.Entities);
            writer.WriteEndArray();
        }

        /// <inheritdoc />
        public override EntityLookupKeywordEntry ReadJson(JsonReader reader, Type objectType, EntityLookupKeywordEntry? existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }

    }

    public class EntityLookupEntityEntryJsonConverter : JsonConverter<EntityLookupEntityEntry>
    {

        /// <inheritdoc />
        public override void WriteJson(JsonWriter writer, EntityLookupEntityEntry? value, JsonSerializer serializer)
        {
            if (value == null)
            {
                writer.WriteNull();
                return;
            }
            writer.WriteStartArray();
            writer.WriteValue(value.QName);
            writer.WriteValue(value.Language);
            writer.WriteValue(value.Priority);
            writer.WriteEndArray();
        }

        /// <inheritdoc />
        public override EntityLookupEntityEntry ReadJson(JsonReader reader, Type objectType, EntityLookupEntityEntry? existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }

    }

}
