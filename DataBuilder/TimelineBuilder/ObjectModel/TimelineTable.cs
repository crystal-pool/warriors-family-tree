using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;

public class TimelineTable
{

    public IDictionary<string, TimelineBookEntry> Books { get; set; } = new Dictionary<string, TimelineBookEntry>();

    private static readonly JsonSerializerOptions jsonOptions = new ();
    private static readonly JsonSerializerOptions jsonFormattedOptions = new() { WriteIndented = true };

    public void WriteTo(TextWriter writer)
    {
        WriteTo(writer, false);
    }

    public void WriteTo(TextWriter writer, bool formatted)
    {
        var options = formatted ? jsonFormattedOptions : jsonOptions;
        var json = JsonSerializer.Serialize(this, options);
        writer.Write(json);
    }

    public static TimelineTable ReadFrom(TextReader reader)
    {
        var json = reader.ReadToEnd();
        return JsonSerializer.Deserialize<TimelineTable>(json)!;
    }

    public static TimelineTable LoadFrom(string path)
    {
        using var reader = new StreamReader(path);
        return ReadFrom(reader);
    }

}

public class TimelineBookEntry
{

    public required IList<TimelineSegmentEntry> Segments { get; set; }

    public TimelineSegmentEntry? TryGetFirstBookSegment()
    {
        return Segments.FirstOrDefault(s => s.ChapterNumber is 0 or 1);
    }

    /// <summary>
    /// Tries to match the chapter identifier back to timeline segment.
    /// </summary>
    /// <param name="chapter">the chapter identifier provided in RDF data set, usually the value of P53 "series ordinal" qualifier of P50 "series".</param>
    public TimelineSegmentEntry? TryMatchSegment(string chapter)
    {
        // c.f. https://warriors.huijiwiki.com/wiki/Module:WbClientLite/Timeline
        // Exact match (casing can be different). E.g., "pr", "e", "m", etc.
        var match = Segments.FirstOrDefault(s => string.Equals(s.Chapter, chapter, StringComparison.InvariantCultureIgnoreCase));
        if (match != null) return match;

        // No fraction in entities on Crystal Pool observed so far.
        if (int.TryParse(chapter, out var chapterNumber))
        {
            // Lower bound
            // Use nearest chapter before the specified chapter number.
            // Note that we allow integral-part matching. (Dropped ChapterFraction)
            TimelineSegmentEntry? prevSegment = null;
            foreach (var segment in Segments)
            {
                if (segment.ChapterNumber < 0) continue;
                if (segment.ChapterNumber >= chapterNumber)
                {
                    break;
                }
                prevSegment = segment;
            }
            return prevSegment;
        }
        return null;
    }

}

public class TimelineSegmentEntry
{

    public TimelineSegmentEntry(string chapter, string timeline, int year, float month)
    {
        Chapter = chapter;

        (ChapterNumber, ChapterFraction) = chapter switch
        {
            "pr" => (0, 0), // Prolog
            _ when int.TryParse(chapter, CultureInfo.InvariantCulture, out var cn) => (cn, 0),
            _ when float.TryParse(chapter, CultureInfo.InvariantCulture, out var cnf) => ((int)cnf, cnf - (int)cnf),
            _ => (-1, 0),
        };

        // Max precise float number: 1677216
        if (ChapterNumber > 9999)
            throw new ArgumentOutOfRangeException(nameof(chapter), "Chapter number is too large. Rounding error may occur.");

        Timeline = timeline;
        Year = year;
        Month = month;
    }

    public string Chapter { get; }

    [JsonIgnore]
    public int ChapterNumber { get; }

    [JsonIgnore]
    public float ChapterFraction { get; }

    public string Timeline { get; }

    public int Year { get; }

    public float Month { get; }

}
