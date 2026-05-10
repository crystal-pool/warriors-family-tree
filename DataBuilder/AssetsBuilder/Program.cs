using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using VDS.RDF;
using VDS.RDF.Query.Datasets;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder;

internal static class Program
{

    private static readonly JsonSerializerOptions outputJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static async Task<int> Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.WriteLine("Usage:\ndotnet run rawDataRoot targetRoot");
            return 1;
        }
        var rawDataRoot = Path.GetFullPath(args[0]);
        var targetRoot = Path.GetFullPath(args[1]);
        if (!Directory.Exists(targetRoot))
            Directory.CreateDirectory(targetRoot);

        async Task ExportJsonAsync(string fileName, object root)
        {
            var fullName = Path.Join(targetRoot, fileName);
            {
                await using var fs = new FileStream(fullName, FileMode.Create);
                await JsonSerializer.SerializeAsync(fs, root, outputJsonOptions);
            }
            Console.WriteLine("Exported {0} ({1:#,#} B).", fileName, new FileInfo(fullName).Length);
        }

        var graph = new Graph();
        graph.LoadFromFile(Path.Join(rawDataRoot, RawDataFiles.WbDump));
        Console.WriteLine("Loaded {0} tuples from {1}.", graph.Triples.Count, rawDataRoot);
        var dataset = new InMemoryDataset(graph);
        var timeline = TimelineTable.LoadFrom(Path.Join(rawDataRoot, RawDataFiles.Timeline));
        var builder = new RdfDataBuilder(dataset, graph.NamespaceMap, timeline);

        await ExportJsonAsync("characters.json", builder.BuildCharacterProfile());
        await ExportJsonAsync("relations.json", builder.BuildRelationGraph());
        await ExportJsonAsync("timeline.json", builder.BuildTimelineMarkers());
        await ExportJsonAsync("links.json", builder.BuildEntityLinks());
        foreach (var (language, root) in builder.BuildEntityLabels())
        {
            await ExportJsonAsync($"labels.{language}.json", root);
        }
        await ExportJsonAsync("entityLookup.json", builder.BuildEntityLookupTable());
        return 0;
    }

}
