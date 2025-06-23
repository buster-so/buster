use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::hash::Hash;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum TableKind {
    Base,    // A standard table from the database
    Cte,     // A Common Table Expression
    Derived, // Represents a subquery used as a table factor
    Function, // Represents a table-valued function call
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct QuerySummary {
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub tables: Vec<TableInfo>,
    #[serde(skip_serializing_if = "HashSet::is_empty")]
    pub joins: HashSet<JoinInfo>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub ctes: Vec<CteSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TableInfo {
    pub database_identifier: Option<String>,
    pub schema_identifier: Option<String>,
    pub table_identifier: String, // For Base: table name; For CTE: CTE name; For Derived: alias or generated ID
    pub alias: Option<String>,
    pub columns: HashSet<String>,
    pub kind: TableKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subquery_summary: Option<Box<QuerySummary>>, // Only relevant for TableKind::Derived
}

// Custom Hash implementation because QuerySummary is not Hash
impl std::hash::Hash for TableInfo {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.database_identifier.hash(state);
        self.schema_identifier.hash(state);
        self.table_identifier.hash(state);
        self.alias.hash(state);
        // Hash columns deterministically
        let mut cols: Vec<_> = self.columns.iter().collect();
        cols.sort_unstable();
        cols.hash(state);
        self.kind.hash(state);
        // subquery_summary is not included in the hash
    }
}

// Custom Eq implementation needed because QuerySummary is not Eq
impl Eq for TableInfo {}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct JoinInfo {
    pub left_table: String,  // Can be table name, CTE name, or Derived alias/ID
    pub right_table: String, // Can be table name, CTE name, or Derived alias/ID
    pub condition: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CteSummary {
    pub name: String,
    pub summary: Box<QuerySummary>,
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub column_mappings: HashMap<String, (String, String)>, // Optional: Map CTE output column to source
}

/// A parameter definition for parameterized metrics and filters
#[derive(Serialize, Debug, Clone)]
pub struct Parameter {
    pub name: String,
    pub param_type: ParameterType,
    pub default: Option<String>,
}

/// Parameter types supported in parameterized metrics and filters
#[derive(Serialize, Debug, Clone, PartialEq, Eq)]
pub enum ParameterType {
    #[serde(rename = "number")]
    Number,
    #[serde(rename = "string")]
    String,
    #[serde(rename = "date")]
    Date,
    #[serde(rename = "boolean")]
    Boolean,
}

/// A metric definition in the semantic layer
#[derive(Serialize, Debug, Clone)]
pub struct Metric {
    pub name: String,
    pub table: String,
    pub expression: String,
    pub parameters: Vec<Parameter>,
    pub description: Option<String>,
}

/// A filter definition in the semantic layer
#[derive(Serialize, Debug, Clone)]
pub struct Filter {
    pub name: String,
    pub table: String,
    pub expression: String,
    pub parameters: Vec<Parameter>,
    pub description: Option<String>,
}

/// Defines a relationship between tables in the semantic layer
#[derive(Serialize, Debug, Clone)]
pub struct Relationship {
    pub from_table: String,
    pub from_column: String,
    pub to_table: String,
    pub to_column: String,
}

/// Validation modes for semantic layer queries
#[derive(Serialize, Debug, Clone, Copy, PartialEq, Eq)]
pub enum ValidationMode {
    /// Strict mode: Only predefined metrics and filters, direct joins only
    Strict,
    /// Flexible mode: Only validates joins, allows arbitrary column usage
    Flexible,
}

/// The semantic layer metadata containing tables, metrics, filters, and relationships
#[derive(Serialize, Debug, Clone)]
pub struct SemanticLayer {
    pub tables: HashMap<String, Vec<String>>, // Table name -> columns
    pub metrics: HashMap<String, Metric>,     // Metric name -> definition
    pub filters: HashMap<String, Filter>,     // Filter name -> definition
    pub relationships: Vec<Relationship>,     // Table relationships
}

impl SemanticLayer {
    /// Creates a new empty semantic layer
    pub fn new() -> Self {
        Self {
            tables: HashMap::new(),
            metrics: HashMap::new(),
            filters: HashMap::new(),
            relationships: Vec::new(),
        }
    }

    /// Adds a table to the semantic layer
    pub fn add_table(&mut self, name: &str, columns: Vec<&str>) {
        self.tables.insert(
            name.to_string(),
            columns.into_iter().map(|c| c.to_string()).collect(),
        );
    }

    /// Adds a metric to the semantic layer
    pub fn add_metric(&mut self, metric: Metric) {
        self.metrics.insert(metric.name.clone(), metric);
    }

    /// Adds a filter to the semantic layer
    pub fn add_filter(&mut self, filter: Filter) {
        self.filters.insert(filter.name.clone(), filter);
    }

    /// Adds a relationship to the semantic layer
    pub fn add_relationship(&mut self, relationship: Relationship) {
        self.relationships.push(relationship);
    }

    /// Checks if two tables are directly related in the semantic layer
    pub fn are_tables_related(&self, table1: &str, table2: &str) -> bool {
        self.relationships.iter().any(|r| {
            (r.from_table == table1 && r.to_table == table2)
                || (r.from_table == table2 && r.to_table == table1)
        })
    }

    /// Gets the metric by its name
    pub fn get_metric(&self, name: &str) -> Option<&Metric> {
        self.metrics.get(name)
    }

    /// Gets the filter by its name
    pub fn get_filter(&self, name: &str) -> Option<&Filter> {
        self.filters.get(name)
    }

    /// Checks if a metric name exists
    pub fn has_metric(&self, name: &str) -> bool {
        self.metrics.contains_key(name)
    }

    /// Checks if a filter name exists
    pub fn has_filter(&self, name: &str) -> bool {
        self.filters.contains_key(name)
    }

    /// Checks if a table exists
    pub fn has_table(&self, name: &str) -> bool {
        self.tables.contains_key(name)
    }

    /// Checks if a column exists in a table
    pub fn has_column(&self, table: &str, column: &str) -> bool {
        self.tables
            .get(table)
            .map(|columns| columns.contains(&column.to_string()))
            .unwrap_or(false)
    }
}
