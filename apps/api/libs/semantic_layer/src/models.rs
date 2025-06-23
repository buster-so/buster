use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Model {
    pub name: String,
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data_source_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub database: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema: Option<String>,
    #[serde(default)] // Use default empty vec if missing
    pub dimensions: Vec<Dimension>,
    #[serde(default)]
    pub measures: Vec<Measure>,
    #[serde(default)]
    pub metrics: Vec<Metric>,
    #[serde(default)]
    pub filters: Vec<Filter>,
    #[serde(default)] // Added default
    pub relationships: Vec<Relationship>,
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Dimension {
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "type")] // Rename field 'type_' to avoid Rust keyword collision
    pub type_: Option<String>, // 'type' is optional according to spec
    #[serde(default)] // Default to false if 'searchable' is missing
    pub searchable: bool,
    pub options: Option<Vec<String>>, // Default to None if 'options' is missing
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Measure {
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>, // 'type' is optional according to spec
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Metric {
    pub name: String,
    pub expr: String,
    pub description: Option<String>,
    #[serde(default)] // Changed from Option<Vec<Argument>>
    pub args: Vec<Argument>,
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Filter {
    pub name: String,
    pub expr: String,
    pub description: Option<String>,
    #[serde(default)] // Changed from Option<Vec<Argument>>
    pub args: Vec<Argument>,
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Argument {
    pub name: String,
    #[serde(rename = "type")]
    pub type_: String, // 'type' is required for arguments
    pub description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, PartialEq)]
pub struct Relationship {
    pub name: String,
    pub source_col: String,
    pub ref_col: String,
    #[serde(rename = "type")]
    pub type_: Option<String>, // 'type' is optional according to spec
    pub cardinality: Option<String>, // 'cardinality' is optional
    pub description: Option<String>,
}