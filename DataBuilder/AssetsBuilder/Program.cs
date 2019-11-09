using System;
using System.IO;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using VDS.RDF;
using VDS.RDF.Query.Datasets;

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
                Console.WriteLine("Usage:\ndotnet run dumpPath targetPath");
                return 1;
            }
            var dumpPath = Path.GetFullPath(args[0]);
            var targetPath = Path.GetFullPath(args[1]);
            if (!Directory.Exists(targetPath))
                Directory.CreateDirectory(targetPath);
            void ExportJson(string fileName, object root)
            {
                var fullName = Path.Join(targetPath, fileName);
                {
                    using var sw = new StreamWriter(fullName);
                    using var jw = new JsonTextWriter(sw);
                    outputJsonSerializer.Serialize(jw, root);
                }
                Console.WriteLine("Exported {0} ({1:#,#} B).", fileName, new FileInfo(fullName).Length);
            }

            var graph = new Graph();
            graph.LoadFromFile(dumpPath);
            Console.WriteLine("Loaded {0} tuples from {1}.", graph.Triples.Count, dumpPath);
            var dataset = new InMemoryDataset(graph);
            var builder = new RdfDataBuilder(dataset, graph.NamespaceMap);
            ExportJson("characters.json", builder.BuildCharacterProfile());
            ExportJson("relations.json", builder.BuildRelationGraph());
            foreach (var (language, root) in builder.BuildEntityLabels())
            {
                ExportJson($"labels.{language}.json", root);
            }
            ExportJson("entityLookup.json", builder.BuildEntityLookupTable());
            return 0;
        }

    }
}
