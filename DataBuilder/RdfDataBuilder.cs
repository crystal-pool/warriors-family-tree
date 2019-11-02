using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Resources;
using System.Text;
using VDS.RDF;
using VDS.RDF.Nodes;
using VDS.RDF.Parsing;
using VDS.RDF.Query;
using VDS.RDF.Query.Datasets;
using WarriorsFamilyTree.DataBuilder.Contracts;

namespace WarriorsFamilyTree.DataBuilder
{
    public class RdfDataBuilder
    {

        private readonly ISparqlDataset dataset;
        private readonly INamespaceMapper namespaceMapper;
        private readonly ISparqlQueryProcessor sparqlProcessor;
        private readonly SparqlQueryParser sparqlQueryParser;

        public RdfDataBuilder(ISparqlDataset dataset, INamespaceMapper namespaceMapper)
        {
            this.dataset = dataset ?? throw new ArgumentNullException(nameof(dataset));
            this.namespaceMapper = namespaceMapper ?? throw new ArgumentNullException(nameof(namespaceMapper));
            sparqlProcessor = new LeviathanQueryProcessor(dataset);
            sparqlQueryParser = new SparqlQueryParser();
        }

        public SparqlResultSet ExecuteQuery(string query)
        {
            var queryString = new SparqlParameterizedString(query);
            foreach (var prefix in namespaceMapper.Prefixes)
            {
                if (!queryString.Namespaces.HasNamespace(prefix))
                {
                    queryString.Namespaces.AddNamespace(prefix, namespaceMapper.GetNamespaceUri(prefix));
                }
            }
            var parsed = sparqlQueryParser.ParseFromString(queryString);
            return (SparqlResultSet)sparqlProcessor.ProcessQuery(parsed);
        }

        public static string GetQueryFromResource(string name)
        {
            using var s = typeof(RdfDataBuilder).Assembly.GetManifestResourceStream("WarriorsFamilyTree.DataBuilder.Queries." + name);
            if (s == null)
                throw new ArgumentException("Cannot find the specified query resource: " + name + ".");
            using var sr = new StreamReader(s);
            return sr.ReadToEnd();
        }

        public SparqlResultSet ExecuteQueryFromResource(string name)
        {
            var query = GetQueryFromResource(name);
            var sw = Stopwatch.StartNew();
            var result = ExecuteQuery(query);
            Console.WriteLine("Executed {0} in {1}, returned {2} rows.", name, sw.Elapsed, result.Count);
            return result;
        }

        private string ReduceUri(Uri uri)
        {
            if (namespaceMapper.ReduceToQName(uri.ToString(), out var qname))
                return qname;
            return ":" + uri;
        }

        private string SerializeUriNode(INode node)
        {
            if (node is IBlankNode)
                return "_:";
            var unode = (IUriNode)node;
            return ReduceUri(unode.Uri);
        }

        private static readonly IList<string> localizationLanguages = new List<string>
        {
            "cs",
            "de",
            "en-us",
            "en-gb",
            "es",
            "fi",
            "fr",
            "it",
            "ja-jp",
            "ko-kr",
            "lt",
            "nl",
            "pl",
            "ru",
            "uk",
            "zh-cn",
            "zh-tw",
        };

        public IDictionary<string, LabelsRoot> BuildEntityLabels()
        {
            var resultSet = ExecuteQueryFromResource("EntityLabels.rq");
            var rootsByLanguage = new Dictionary<string, LabelsRoot>();
            foreach (var language in localizationLanguages)
                rootsByLanguage.Add(language, new LabelsRoot { Labels = new Dictionary<string, EntityLabel>() });
            foreach (var group in resultSet.Select(row =>
                    (Entity: SerializeUriNode(row["entity"]),
                        Text: ((ILiteralNode)row["label"]).Value,
                        Language: ((ILiteralNode)row["label"]).Language))
                .GroupBy(r => r.Entity))
            {
                var entity = group.Key;
                var labels = group.ToDictionary(r => r.Language, r => r.Text);
                foreach (var (language, root) in rootsByLanguage)
                {
                    var label = LanguageUtility.GetTextWithFallback(language, labels);
                    if (!string.IsNullOrEmpty(label))
                        root.Labels.Add(entity, new EntityLabel { Label = label });
                }
            }
            resultSet = ExecuteQueryFromResource("EntityDescriptions.rq");
            foreach (var group in resultSet.Select(row =>
                    (Entity: SerializeUriNode(row["entity"]),
                        Text: ((ILiteralNode)row["desc"]).Value,
                        Language: ((ILiteralNode)row["desc"]).Language))
                .GroupBy(r => r.Entity))
            {
                var entity = group.Key;
                var labels = group.ToDictionary(r => r.Language, r => r.Text);
                foreach (var (language, root) in rootsByLanguage)
                {
                    var desc = LanguageUtility.GetTextWithFallback(language, labels);
                    if (!string.IsNullOrEmpty(desc))
                    {
                        if (!root.Labels.TryGetValue(entity, out var label))
                        {
                            label = new EntityLabel();
                            root.Labels.Add(entity, label);
                        }
                        label.Description = desc;
                    }
                }
            }
            return rootsByLanguage;
        }

        public RelationGraphRoot BuildRelationGraph()
        {
            var resultSet = ExecuteQueryFromResource("CharacterRelation.rq");
            var root = new RelationGraphRoot();
            // ?character ?type ?ordinal ?since ?until ?target ?cause ?ref ?reliability
            INode tempNode;
            root.Relations = resultSet.Select(row => new EntityRelationRecord
            {
                Subject = SerializeUriNode(row["character"])!,
                Relation = row["type"].AsValuedNode().AsString(),
                Target = SerializeUriNode(row["target"]),
                Ordinal = row.TryGetBoundValue("ordinal", out tempNode) ? (int?)Convert.ToInt32(tempNode.AsValuedNode().AsString()) : null,
                Since = row.TryGetBoundValue("since", out tempNode) ? SerializeUriNode(tempNode) : null,
                Until = row.TryGetBoundValue("until", out tempNode) ? SerializeUriNode(tempNode) : null,
                Cause = row.TryGetBoundValue("cause", out tempNode) ? SerializeUriNode(tempNode) : null,
                Reference = row.TryGetBoundValue("ref", out tempNode) ? SerializeUriNode(tempNode) : null,
                Reliability = row.TryGetBoundValue("reliability", out tempNode) ? SerializeUriNode(tempNode) : null
            })
                .GroupBy(r => r.Subject)
                .ToDictionary(g => g.Key, g => (IList<EntityRelationRecord>)g.ToList());
            return root;
        }

        public EntityLookupTableRoot BuildEntityLookupTable()
        {
            var resultSet = ExecuteQueryFromResource("EntityLookupLabels.rq");
            var root = new EntityLookupTableRoot();
            // ?entity ?label ?priority
            root.Entries = resultSet.Select(row => (
                    Entity: SerializeUriNode(row["entity"]),
                    Text: ((ILiteralNode)row["label"]).Value,
                    Language: ((ILiteralNode)row["label"]).Language,
                    Priority: (int)row["priority"].AsValuedNode().AsInteger()))
                .GroupBy(r => r.Text)
                .Select(kwg => new EntityLookupKeywordEntry
                {
                    Keyword = kwg.Key,
                    Entities = kwg.Select(e => new EntityLookupEntityEntry
                    {
                        QName = e.Entity,
                        Language = e.Language,
                        Priority = e.Priority
                    }).OrderByDescending(e => e.Priority).ThenBy(e => e.QName).ToList()
                }).OrderBy(e => e.Keyword, StringComparer.InvariantCultureIgnoreCase)
                .ToList();
            return root;
        }

        public CharacterProfileRoot BuildCharacterProfile()
        {
            var root = new CharacterProfileRoot();

            CharacterProfileEntry GetProfileEntry(Uri uri)
            {
                var qName = ReduceUri(uri);
                if (!root.Characters.TryGetValue(qName, out var value))
                {
                    value = new CharacterProfileEntry();
                    root.Characters.Add(qName, value);
                }
                return value;
            }

            CharacterProfileEntry GetProfileEntryFromNode(INode node)
            {
                var unode = (IUriNode)node;
                return GetProfileEntry(unode.Uri);
            }
            var resultSet = ExecuteQueryFromResource("CharacterGender.rq");
            foreach (var row in resultSet)
            {
                var entry = GetProfileEntryFromNode(row["character"]);
                entry.Gender = row["gender"].AsValuedNode().AsString();
            }
            return root;
        }

    }
}
