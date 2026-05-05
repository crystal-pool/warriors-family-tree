using WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;

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

        var apiEndpointUrl = Environment.GetEnvironmentVariable("MW_API_ENDPOINT");
        if (!string.IsNullOrEmpty(apiEndpointUrl))
        {
            Console.WriteLine("Loaded API endpoint URL from environment variable.");
        }
        else
        {
            apiEndpointUrl = null;
        }
        var timelineTable = await TimelineModuleDownloader.FetchTimelineModuleAsync(apiEndpointUrl);
        // Sort keys.
        timelineTable.Books = new SortedDictionary<string, TimelineBookEntry>(timelineTable.Books);
        // Write formatted JSON.
        await using (var writer = new StreamWriter(args[0]))
            timelineTable.WriteTo(writer, true);
        Console.WriteLine("Timeline data written to {0}.", args[0]);
        return 0;
    }

}
