using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.Contracts;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;
using WikiClientLibrary.Client;
using WikiClientLibrary.Scribunto;
using WikiClientLibrary.Sites;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder
{

    public static class TimelineModuleDownloader
    {

        public const string MwApiEndpointUrl = "http://warriors.huijiwiki.com/api.php";

        private static readonly IDictionary<string, int> timelineOrigins = new Dictionary<string, int>{
            { "dotc", 1000 },
            { "modern", 2000 },
        };

        private static readonly JsonSerializer jsonSerializer = new JsonSerializer
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver()
        };

        public static async Task<TimelineTable> FetchTimelineModuleAsync()
        {
            using var wikiClient = new WikiClient { ClientUserAgent = "WarriorsFamilyTree.DataBuilder.TimelineBuilder/1.0" };
            var wikiSite = new WikiSite(wikiClient, MwApiEndpointUrl);
            await wikiSite.Initialization;
            var root = await wikiSite.ScribuntoLoadDataAsync<JObject>("Timeline/bookData");
            // Name: entity ID, Value: book abbr.
            var itemLookupDict = root["__itemLookup"]?.Children<JProperty>().ToDictionary(p => p.Value, p => p.Name);
            // Fix Lua objects
            foreach (var p in root.Properties())
            {
                if (p.Value["details"] is JArray arr)
                {
                    p.Value["details"] = new JObject(arr.Select((e, i) => new JProperty((i + 1).ToString(), e)));
                }
            }
            var entries = root.Properties().Where(p => !p.Name.StartsWith("__"))
                .ToDictionary(p =>
                {
                    var name = p.Name;
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
                        Console.WriteLine("Warning: {0} does not seem like a valid entity name.", name);
                        name = ":" + name;
                    }
                    return name;
                }, p => p.Value.ToObject<BookEntry>(jsonSerializer)!);
            return new TimelineTable
            {
                Books = entries.ToDictionary(p => p.Key,
                    p => new TimelineBookEntry
                    {
                        Segments = p.Value.Interval.Select(i =>
                        {
                            var details = p.Value.Details[i];
                            var timeline = timelineOrigins.OrderBy(p => Math.Abs(p.Value - details.Year)).First();
                            return new TimelineSegmentEntry(i, timeline.Key, details.Year - timeline.Value, details.Month);
                        }).ToList()
                    })
            };
        }

    }

}
