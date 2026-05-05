using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using VDS.RDF;
using VDS.RDF.Query.Datasets;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder;

static class Program
{

    private static readonly JsonSerializerOptions outputJsonOptions = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    static int Main(string[] args)
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
        void ExportJson(string fileName, object root)
        {
            var fullName = Path.Join(targetRoot, fileName);
            {
                using var fs = new FileStream(fullName, FileMode.Create);
                JsonSerializer.Serialize(fs, root, root.GetType(), outputJsonOptions);
            }
            Console.WriteLine("Exported {0} ({1:#,#} B).", fileName, new FileInfo(fullName).Length);
        }

        var graph = new Graph();
        graph.LoadFromFile(Path.Join(rawDataRoot, RawDataFiles.WbDump));
        Console.WriteLine("Loaded {0} tuples from {1}.", graph.Triples.Count, rawDataRoot);
        var dataset = new InMemoryDataset(graph);
        var timeline = TimelineTable.LoadFrom(Path.Join(rawDataRoot, RawDataFiles.Timeline));
        var builder = new RdfDataBuilder(dataset, graph.NamespaceMap, timeline);
        ExportJson("characters.json", builder.BuildCharacterProfile());
        ExportJson("relations.json", builder.BuildRelationGraph());
        ExportJson("timeline.json", builder.BuildTimelineMarkers());
        ExportJson("links.json", builder.BuildEntityLinks());
        foreach (var (language, root) in builder.BuildEntityLabels())
        {
            ExportJson($"labels.{language}.json", root);
        }
        ExportJson("entityLookup.json", builder.BuildEntityLookupTable());
        return 0;
    }

}
