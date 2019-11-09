using System;
using System.Collections.Generic;
using System.IO;
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

    }

    public class TimelineBookEntry
    {

        public IList<TimelineChapterEntry> Segments { get; set; } = new List<TimelineChapterEntry>();

    }

    public class TimelineChapterEntry
    {

        public TimelineChapterEntry(string chapter, int year, int month)
        {
            Chapter = chapter;
            Year = year;
            Month = month;
        }

        public string Chapter { get; }

        public int Year { get; }

        public int Month { get; }

    }

}
