using System;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using VDS.RDF;
using VDS.RDF.Query.Datasets;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder
{
    static class Program
    {

        private static readonly JsonSerializer outputJsonSerializer = new JsonSerializer
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            NullValueHandling = NullValueHandling.Ignore
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
                    using var sw = new StreamWriter(fullName);
                    using var jw = new JsonTextWriter(sw);
                    outputJsonSerializer.Serialize(jw, root);
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
}
