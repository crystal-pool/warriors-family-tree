using System;
using System.Collections.Generic;
using System.Text;

namespace WarriorsFamilyTree.DataBuilder.Contracts
{

    /// <summary>
    /// JSON root object for <c>relationGraph.json</c>.
    /// </summary>
    public class RelationGraphRoot
    {

        // key: clustered by Subject
        public IDictionary<string, IList<EntityRelationRecord>> Relations { get; set; }

    }

    public class EntityRelationRecord
    {

        public string Subject { get; set; }

        public string Relation { get; set; }

        public string Target { get; set; }

        public int? Ordinal { get; set; }

        public string? Since { get; set; }

        public string? Until { get; set; }

        public string? Cause { get; set; }

        public string? Reference { get; set; }

        public string? Reliability { get; set; }

    }

}
