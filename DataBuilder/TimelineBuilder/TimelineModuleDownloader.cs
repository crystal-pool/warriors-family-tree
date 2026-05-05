using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
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
    };

    public static async Task<TimelineTable> FetchTimelineModuleAsync()
    {
        using var wikiClient = new WikiClient { ClientUserAgent = "WarriorsFamilyTree.DataBuilder.TimelineBuilder/1.0" };
        var wikiSite = new WikiSite(wikiClient, MwApiEndpointUrl);
        await wikiSite.Initialization;
        // Mitigates https://phabricator.wikimedia.org/T269990
        Console.WriteLine("Fetching live timeline data from: [[Module:{0}]]", TimelineBookDataModuleName);
        var root = await wikiSite.ScribuntoLoadDataAsync<JsonObject>(TimelineBookDataModuleName, @"
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

return deepcopy(p)
");
        Console.WriteLine("Building timeline data.");
        // Name: entity ID, Value: book abbr.
        var itemLookupNode = root["__itemLookup"]?.AsObject();
        var itemLookupDict = itemLookupNode?.ToDictionary(p => p.Value!.GetValue<string>(), p => p.Key);
        // Skip non-book entity special data constructs.
        var bookEntryKeys = root.Where(p => !p.Key.StartsWith("__")).Select(p => p.Key).ToList();
        // Fix Lua objects: Convert [ "a", "b", "c" ] into { "1": "a", "2": "b", "3": "c" }
        foreach (var key in bookEntryKeys)
        {
            var entry = root[key];
            if (entry?["details"] is JsonArray arr)
            {
                var obj = new JsonObject();
                for (int i = 0; i < arr.Count; i++)
                {
                    obj[(i + 1).ToString()] = arr[i]?.DeepClone();
                }
                entry["details"] = obj;
            }
        }
        var entries = bookEntryKeys.ToDictionary(key =>
        {
            var name = key;
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
        }, key => root[key].Deserialize<BookEntry>(jsonOptions)!);
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
                        Console.WriteLine("Failed to generate timeline table for book {0}.", p.Key);
                        Console.WriteLine("Hint: available chapter keys are: {0}.", string.Join(", ", p.Value.Details.Keys));
                        throw;
                    }
                })
        };
    }

}
