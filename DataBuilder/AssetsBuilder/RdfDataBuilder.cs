using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using VDS.RDF;
using VDS.RDF.Nodes;
using VDS.RDF.Parsing;
using VDS.RDF.Query;
using VDS.RDF.Query.Datasets;
using WarriorsFamilyTree.DataBuilder.AssetsBuilder.Contracts;
using WarriorsFamilyTree.DataBuilder.TimelineBuilder.ObjectModel;

namespace WarriorsFamilyTree.DataBuilder.AssetsBuilder
{
    public class RdfDataBuilder
    {

        private readonly ISparqlDataset dataset;
        private readonly INamespaceMapper namespaceMapper;
        private readonly TimelineTable timelineTable;
        private readonly ISparqlQueryProcessor sparqlProcessor;
        private readonly SparqlQueryParser sparqlQueryParser;

        public RdfDataBuilder(ISparqlDataset dataset, INamespaceMapper namespaceMapper, TimelineTable timelineTable)
        {
            this.dataset = dataset ?? throw new ArgumentNullException(nameof(dataset));
            this.namespaceMapper = namespaceMapper ?? throw new ArgumentNullException(nameof(namespaceMapper));
            this.timelineTable = timelineTable ?? throw new ArgumentNullException(nameof(timelineTable));
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
            using var s = typeof(RdfDataBuilder).Assembly.GetManifestResourceStream("WarriorsFamilyTree.DataBuilder.AssetsBuilder.Queries." + name);
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
            "da",
            "de",
            "en-us",
            "en-gb",
            "es",
            "fi",
            "fr",
            "hu",
            "it",
            "ja-jp",
            "ko-kr",
            "lt",
            "nl",
            "no",
            "pl",
            "pt",
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

        public EntityLinksRoot BuildEntityLinks()
        {
            var resultSet = ExecuteQueryFromResource("EntityLinks.rq");
            var root = new EntityLinksRoot
            {
                Links = resultSet
                    .Select(row => (entity: SerializeUriNode(row["entity"]),
                        link: new EntityLink
                        {
                            Link = row["link"].AsValuedNode().AsString(),
                            Site = row["site"].AsValuedNode().AsString(),
                            Name = row["name"].AsValuedNode().AsString()
                        })).GroupBy(r => r.entity).ToDictionary(g => g.Key, g => (IList<EntityLink>)g.Select(r => r.link).ToList())
            };
            return root;
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
            resultSet = ExecuteQueryFromResource("CharacterAffiliations.rq");
            foreach (var row in resultSet)
            {
                var entry = GetProfileEntryFromNode(row["character"]);
                var affEntry = new CharacterAffiliationEntry
                {
                    Group = SerializeUriNode(row["group"]),
                    Since = row.TryGetBoundValue("startTime", out INode tempNode) ? SerializeUriNode(tempNode) : null,
                    Until = row.TryGetBoundValue("endTime", out tempNode) ? SerializeUriNode(tempNode) : null,
                };
                if (entry.Affiliations == null) entry.Affiliations = new List<CharacterAffiliationEntry>();
                entry.Affiliations.Add(affEntry);
            }
            resultSet = ExecuteQueryFromResource("CharacterPositionsHeld.rq");
            foreach (var row in resultSet)
            {
                var entry = GetProfileEntryFromNode(row["character"]);
                var posEntry = new CharacterPositionEntry
                {
                    Position = SerializeUriNode(row["position"]),
                    Of = row.TryGetBoundValue("of", out var tempNode) ? SerializeUriNode(tempNode) : null,
                    Since = row.TryGetBoundValue("startTime", out tempNode) ? SerializeUriNode(tempNode) : null,
                    Until = row.TryGetBoundValue("endTime", out tempNode) ? SerializeUriNode(tempNode) : null,
                };
                if (entry.PositionsHeld == null) entry.PositionsHeld = new List<CharacterPositionEntry>();
                entry.PositionsHeld.Add(posEntry);
            }
            resultSet = ExecuteQueryFromResource("CharacterNames.rq");

            CharacterLocalizedName CharacterLocalizedNameFromNode(ILiteralNode node)
            {
                return new CharacterLocalizedName { Text = node.Value, Language = node.Language };
            }
            foreach (var group in resultSet.GroupBy(r => (((IUriNode)r["character"]).Uri, r["claim"])))
            {
                var (character, _) = group.Key;
                var entry = GetProfileEntry(character);
                var firstRow = group.First();
                // We allow "unknown value" for name.
                var name0 = firstRow["name0"] is ILiteralNode literal ? CharacterLocalizedNameFromNode(literal) : null;
                var nameEntry = new CharacterNameEntry
                {
                    Since = firstRow.TryGetBoundValue("startTime", out var tempNode) ? SerializeUriNode(tempNode) : null,
                    Until = firstRow.TryGetBoundValue("endTime", out tempNode) ? SerializeUriNode(tempNode) : null,
                };
                if (name0 != null) nameEntry.Name.Add(name0);
                foreach (var row in group)
                {
                    if (!row.HasBoundValue("name1")) continue;
                    nameEntry.Name.Add(CharacterLocalizedNameFromNode((ILiteralNode)row["name1"]));
                }
                if (entry.Names == null) entry.Names = new List<CharacterNameEntry>();
                entry.Names.Add(nameEntry);
            }
            return root;
        }

        public TimelineRoot BuildTimelineMarkers()
        {
            var resultSet = ExecuteQueryFromResource("TimelineMarkers.rq");
            return new TimelineRoot
            {
                Markers = resultSet.Select(r =>
                    {
                        var entityQName = SerializeUriNode(r["entity"]);
                        var bookQName = SerializeUriNode(r["book"]);
                        TimelineSegmentEntry? segment = null;
                        TimelineMarkerInfo? marker = null;
                        if (timelineTable.Books.TryGetValue(bookQName, out var book))
                        {
                            if (r.HasBoundValue("serial"))
                            {
                                var serial = ((ILiteralNode)r["serial"]).Value;
                                segment = book.TryMatchSegment(serial);
                            }
                            else
                            {
                                segment = book.TryGetFirstBookSegment();
                            }
                        }
                        if (segment != null)
                            marker = new TimelineMarkerInfo { Month = segment.Year * 12 + segment.Month, TimelineName = segment.Timeline };
                        return (entityQName, marker);
                    }).Where(i => i.marker != null)
                    .ToDictionary(i => i.entityQName, i => i.marker!)
            };
        }

    }
}
