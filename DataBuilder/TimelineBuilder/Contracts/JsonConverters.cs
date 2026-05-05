using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder.Contracts;

/// <summary>
/// Handles JSON number tokens where a string is expected, converting them to their string representation.
/// </summary>
/// <remarks>
/// Lua serializes numeric table keys (e.g., chapter numbers) as JSON numbers,
/// but the C# contract expects them as strings.
/// </remarks>
internal class NumberAsStringConverter : JsonConverter<string>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            if (reader.TryGetInt64(out var l))
                return l.ToString();
            return reader.GetDouble().ToString(CultureInfo.InvariantCulture);
        }
        return reader.GetString();
    }

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value);
    }
}

/// <summary>
/// Handles JSON floating-point tokens where an integer is expected.
/// Throws if the conversion would lose precision.
/// </summary>
/// <remarks>
/// Lua represents all numbers as doubles, so integer values may arrive as e.g. 6.0.
/// </remarks>
internal class FloatToIntConverter : JsonConverter<int>
{
    public override int Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number)
        {
            if (reader.TryGetInt32(out var i))
                return i;
            var d = reader.GetDouble();
            var truncated = (int)d;
            if (Math.Abs(d - truncated) > 1e-9)
                throw JsonContractHelper.CreateJsonException($"Cannot convert {d} to Int32 without rounding loss.");
            return truncated;
        }
        throw JsonContractHelper.CreateJsonException($"Unexpected token type {reader.TokenType} when reading Int32.");
    }

    public override void Write(Utf8JsonWriter writer, int value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(value);
    }
}
