using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder.Contracts;

[JsonConverter(typeof(TimelineModuleRootConverter))]
internal class TimelineModuleRoot
{
    /// <summary>
    /// Maps the <em>Entity ID</em> back to <em>book abbreviation</em> (a.k.a. internal book ID).
    /// </summary>
    public IDictionary<string, string>? ItemLookup { get; set; }

    public required IDictionary<string, BookEntry> Books { get; set; }
}

internal class TimelineModuleRootConverter : JsonConverter<TimelineModuleRoot>
{
    public override TimelineModuleRoot? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException("Expected StartObject.");

        var result = new TimelineModuleRoot { Books = new Dictionary<string, BookEntry>() };
        while (reader.Read() && reader.TokenType == JsonTokenType.PropertyName)
        {
            var key = reader.GetString()!;
            reader.Read();
            if (key == "__itemLookup")
            {
                try
                {
                    result.ItemLookup = JsonSerializer.Deserialize<IDictionary<string, string>>(ref reader, options);
                }
                catch (JsonException ex)
                {
                    // So that serializer appends the outer path to the wrapper.
                    // See https://github.com/dotnet/docs/issues/21312
                    throw JsonContractHelper.CreateJsonException("Error occurred while deserializing __itemLookup.", ex);
                }
            }
            else if (key.StartsWith("__", StringComparison.Ordinal))
            {
                reader.Skip();
            }
            else
            {
                try
                {
                    result.Books[key] = JsonSerializer.Deserialize<BookEntry>(ref reader, options)!;
                }
                catch (JsonException ex)
                {
                    throw JsonContractHelper.CreateJsonException($"Error occurred while deserializing BookEntry: {key}.", ex);
                }
            }
        }
        return result;
    }

    public override void Write(Utf8JsonWriter writer, TimelineModuleRoot value, JsonSerializerOptions options)
    {
        throw new NotSupportedException();
    }
}

internal class BookEntry
{
    public List<string> Interval { get; set; } = new List<string>();

    public string? BookName { get; set; }

    public IDictionary<string, BookChapterDetail> Details { get; set; } = new Dictionary<string, BookChapterDetail>();
}

internal class BookChapterDetail
{
    public int Year { get; set; }

    public float Month { get; set; }
}
