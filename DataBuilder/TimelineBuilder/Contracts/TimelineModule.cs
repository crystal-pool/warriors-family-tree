using System;
using System.Collections.Generic;
using System.Text;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder.Contracts;

internal class BookEntry
{
    public List<string> Interval { get; set; } = new List<string>();

    public string? BookName { get; set; }

    public IDictionary<string, BookChapterDetail> Details { get; set; } = new Dictionary<string, BookChapterDetail>();
}

internal class BookChapterDetail
{
    public int Year { get; set; }

    public int Month { get; set; }
}
