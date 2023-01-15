using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;
using WikiClientLibrary.Client;
using WikiClientLibrary.Scribunto;
using WikiClientLibrary.Sites;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder;

internal static class Program
{

    public static async Task<int> Main(string[] args)
    {
        if (args.Length < 1)
        {
            Console.WriteLine("Usage:\ndotnet run outputJsonPath");
            return 1;
        }
        var timelineTable = await TimelineModuleDownloader.FetchTimelineModuleAsync();
        // Sort keys.
        timelineTable.Books = new SortedDictionary<string, TimelineBookEntry>(timelineTable.Books);
        // Write formatted JSON.
        await using (var writer = new StreamWriter(args[0]))
            timelineTable.WriteTo(writer, true);
        return 0;
    }

}
