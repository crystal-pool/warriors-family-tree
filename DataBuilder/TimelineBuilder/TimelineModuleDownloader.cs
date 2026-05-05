using System.Text.Json;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.Contracts;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;
using WikiClientLibrary.Client;
using WikiClientLibrary.Scribunto;
using WikiClientLibrary.Sites;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder;

public static class TimelineModuleDownloader
{

    public const string MwApiEndpointUrl = "https://warriors.huijiwiki.com/api.php";

    public const string TimelineBookDataModuleName = "Timeline/bookData";

    private static readonly IDictionary<string, int> timelineOrigins = new Dictionary<string, int>{
        { "dotc", 1000 },
        { "modern", 2000 },
    };

    private static readonly JsonSerializerOptions jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new NumberAsStringConverter() },
    };

    public static async Task<TimelineTable> FetchTimelineModuleAsync(string? apiEndpointUrl = null)
    {
        using var wikiClient = new WikiClient
        {
            ClientUserAgent = "WarriorsFamilyTree.DataBuilder.TimelineBuilder/1.0",
        };
        var wikiSite = new WikiSite(wikiClient, apiEndpointUrl ?? MwApiEndpointUrl);
        await wikiSite.Initialization;
        Console.WriteLine("Fetching live timeline data from: [[Module:{0}]]", TimelineBookDataModuleName);
        // A: Mitigates https://phabricator.wikimedia.org/T269990
        // B: Remove other unused fields (e.g., notes)
        // C: Prevents $.[n].details from being serialized as JSON array.
        // Note that tables either starts with 0 or 1 will be serialized into arrays the same.
        var root = await wikiSite.ScribuntoLoadDataAsync<TimelineModuleRoot>(TimelineBookDataModuleName,
            """
            -- A
            function deepcopy(orig)
                local orig_type = type(orig)
                local copy
                if orig_type == 'table' then
                    copy = {}
                    for orig_key, orig_value in next, orig, nil do
                        copy[deepcopy(orig_key)] = deepcopy(orig_value)
                    end
                    setmetatable(copy, deepcopy(getmetatable(orig)))
                else -- number, string, boolean, etc
                    copy = orig
                end
                return copy
            end

            p = deepcopy(p)

            for _, v in pairs(p) do
                if v.details then
                    -- B
                    for k1, v1 in pairs(v.details) do
                        v.details[k1] = { year = v1.year, month = v1.month }
                    end
                    -- C
                    v.details.__ = { _ = '' }
                end
            end

            return p
            """, jsonOptions, CancellationToken.None);
        Console.WriteLine("Building timeline data.");
        // Remove workaround detail entries
        foreach (var b in root.Books)
        {
            b.Value.Details.Remove("__");
        }
        // Name: entity ID, Value: book abbr.
        var itemLookupDict = root.ItemLookup?.ToDictionary(p => p.Value, p => p.Key);
        // Book entries are keyed by abbreviation or entity ID in the module.
        var entries = root.Books.ToDictionary(kvp =>
        {
            var name = kvp.Key;
            if (itemLookupDict != null && itemLookupDict.TryGetValue(name, out var mappedQName))
            {
                name = mappedQName;
            }
            if (name.StartsWith("Q"))
            {
                name = "wd:" + name;
            }
            else
            {
                Console.WriteLine("Warning: {0} seems to be an invalid entity name.", name);
                name = ":" + name;
            }
            return name;
        }, kvp => kvp.Value);
        return new TimelineTable
        {
            Books = entries.ToDictionary(p => p.Key,
                p =>
                {
                    try
                    {
                        return new TimelineBookEntry
                        {
                            Segments = p.Value.Interval.Select(i =>
                            {
                                var details = p.Value.Details[i];
                                var timeline = timelineOrigins.OrderBy(p => Math.Abs(p.Value - details.Year)).First();
                                return new TimelineSegmentEntry(i, timeline.Key, details.Year - timeline.Value, details.Month);
                            }).ToList(),
                        };
                    } catch (Exception)
                    {
                        Console.WriteLine("Failed to generate timeline table for book {0} ({1}).", p.Key, p.Value.BookName);
                        Console.WriteLine("Hint: available chapter keys (in $.details) are: {0}.", string.Join(", ", p.Value.Details.Keys));
                        throw;
                    }
                })
        };
    }

}
