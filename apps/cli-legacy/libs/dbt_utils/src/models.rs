use serde::Deserialize;
use std::collections::HashMap;

// Struct definitions for parsing dbt's catalog.json (v1 schema)

#[derive(Debug, Deserialize, Clone, Default)]
pub struct DbtCatalog {
    // metadata is required by schema, but use Option + default for robustness if block is missing
    #[serde(default)]
    pub metadata: Option<CatalogMetadata>, 
    #[serde(default)] // nodes map is required, default handles if key is missing (empty map)
    pub nodes: HashMap<String, CatalogNode>, 
    #[serde(default)] // sources map is required
    pub sources: HashMap<String, CatalogSource>,
    #[serde(default)]
    pub errors: Option<Vec<String>>, // errors: string[] | null

    // --- Fields kept for potential compatibility or future use, not strictly in v1 catalog properties like nodes/sources/metadata ---
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub macros: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub exposures: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub metrics: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub selectors: Option<HashMap<String, serde_json::Value>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub disabled: Option<HashMap<String, Vec<serde_json::Value>>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_map: Option<HashMap<String, Vec<String>>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub child_map: Option<HashMap<String, Vec<String>>>,
}

#[derive(Debug, Deserialize, Clone, Default)]
pub struct CatalogMetadata { // Was DbtCatalogMetadata; matches schema.metadata
    #[serde(default)] // Though schema implies required, default if block is imperfect
    pub dbt_schema_version: String, 
    #[serde(default)]
    pub dbt_version: Option<String>, // Defaulted in schema "1.10.0a1" but can be other string
    #[serde(default)]
    pub generated_at: Option<String>, // Is string in schema, but make Option for safety
    #[serde(default)]
    pub invocation_id: Option<String>, // string | null
    #[serde(default)]
    pub invocation_started_at: Option<String>, // string | null (from schema)
    #[serde(default)]
    pub env: HashMap<String, String>, // From schema
}

// Represents a "CatalogTable" from the dbt schema (for nodes and sources)
#[derive(Debug, Deserialize, Clone, Default)]
pub struct CatalogNode { // Was DbtNode; represents schema.nodes.<node_name>
    // metadata, columns, stats are required per schema for a CatalogTable
    // Using Option + default for robustness if a catalog is malformed, 
    // but downstream code will need to handle None for these.
    #[serde(default)]
    pub metadata: Option<TableMetadata>, 
    #[serde(default)]
    pub columns: HashMap<String, ColumnMetadata>, 
    #[serde(default)]
    pub stats: HashMap<String, StatsItem>, 
    #[serde(default)]
    pub unique_id: Option<String>, // string | null

    // --- Fields to be populated by post-processing in lib.rs ---
    // These are not directly from catalog.json node structure
    #[serde(skip_deserializing, skip_serializing_if = "Option::is_none")]
    pub derived_resource_type: Option<String>,
    #[serde(skip_deserializing, skip_serializing_if = "Option::is_none")]
    pub derived_model_name_from_file: Option<String>, // Name derived from SQL filename
}

// Using CatalogNode for sources as well, as their structure is CatalogTable
pub type CatalogSource = CatalogNode;


#[derive(Debug, Deserialize, Clone, Default)]
pub struct TableMetadata { // Was DbtNodeMetadata; matches schema.nodes.<node_name>.metadata
    #[serde(rename = "type")]
    pub type_: String, // Required: database object type (e.g. "TABLE", "VIEW")
    pub schema: String, // Required
    pub name: String,   // Required: relation name in the database
    #[serde(default)]
    pub database: Option<String>, // string | null
    #[serde(default)]
    pub comment: Option<String>, // string | null
    #[serde(default)]
    pub owner: Option<String>, // string | null
}

#[derive(Debug, Deserialize, Clone, Default)]
pub struct ColumnMetadata { // Was DbtColumn; matches schema.nodes.<node_name>.columns.<col_name>
    #[serde(rename = "type")]
    pub type_: String, // Required: database column type
    pub index: u32,    // Required
    pub name: String,  // Required
    #[serde(default)]
    pub comment: Option<String>, // string | null
}

#[derive(Debug, Deserialize, Clone, Default)]
pub struct StatsItem { // matches schema.nodes.<node_name>.stats.<stat_name>
    pub id: String, // Required
    pub label: String, // Required
    #[serde(default)]
    pub value: serde_json::Value, // anyOf: boolean, string, number, null. Required.
    pub include: bool, // Required
    #[serde(default)]
    pub description: Option<String>, // string | null
} 