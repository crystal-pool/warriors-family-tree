using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Newtonsoft.Json;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel
{

    public class TimelineTable
    {

        public IDictionary<string, TimelineBookEntry> Books { get; set; } = new Dictionary<string, TimelineBookEntry>();

        private static readonly JsonSerializer jsonSerializer = new JsonSerializer();

        public void WriteTo(TextWriter writer)
        {
            WriteTo(writer, false);
        }

        public void WriteTo(TextWriter writer, bool formatted)
        {
            using var jWriter = new JsonTextWriter(writer)
            {
                Formatting = formatted ? Formatting.Indented : Formatting.None
            };
            jsonSerializer.Serialize(jWriter, this);
        }

        public static TimelineTable ReadFrom(TextReader reader)
        {
            return (TimelineTable)jsonSerializer.Deserialize(reader, typeof(TimelineTable))!;
        }

        public static TimelineTable LoadFrom(string path)
        {
            using var reader = new StreamReader(path);
            return ReadFrom(reader);
        }

    }

    public class TimelineBookEntry
    {

        public IList<TimelineSegmentEntry> Segments { get; set; } = new List<TimelineSegmentEntry>();

        public TimelineSegmentEntry? TryGetFirstBookSegment()
        {
            return Segments.FirstOrDefault(s => s.ChapterNumber == 0 || s.ChapterNumber == 1);
        }

        public TimelineSegmentEntry? TryMatchSegment(string chapter)
        {
            // c.f. https://warriors.huijiwiki.com/wiki/Module:WbClientLite/Timeline
            // Exact match
            var match = Segments.FirstOrDefault(s => s.Chapter == chapter);
            if (match != null) return match;
            if (int.TryParse(chapter, out var chapterNumber))
            {
                // Lower bound
                // Use nearest chapter before the specified chapter number.
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

        public TimelineSegmentEntry(string chapter, string timeline, int year, int month)
        {
            Chapter = chapter;
            switch (chapter)
            {
                case "pr":
                    ChapterNumber = 0;      // Prolog
                    break;
                default:
                    ChapterNumber = int.TryParse(chapter, out var cn) ? cn : -1;
                    break;
            }
            Timeline = timeline;
            Year = year;
            Month = month;
        }

        public string Chapter { get; }

        [JsonIgnore]
        public int ChapterNumber { get; }

        public string Timeline { get; }

        public int Year { get; }

        public int Month { get; }

    }

}
