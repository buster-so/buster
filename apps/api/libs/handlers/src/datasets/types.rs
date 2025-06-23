// This file will contain types related to dataset deployment, like ValidationResult and ValidationError. 

use serde::{Deserialize, Serialize};
use uuid::Uuid;

// --- Local Struct Definitions --- (No import needed for these within this file)
#[derive(Debug, Serialize, Clone)] // Make Cloneable if needed by results.push(validation)
pub struct ValidationResult {
    pub model_name: String,
    pub data_source_name: String,
    pub schema: String,
    pub success: bool,
    pub errors: Vec<ValidationError>,
}

impl ValidationResult {
    pub fn new(model_name: String, data_source_name: String, schema: String) -> Self {
        Self {
            model_name,
            data_source_name,
            schema,
            success: true,
            errors: Vec::new(),
        }
    }

    pub fn add_error(&mut self, error: ValidationError) {
        self.success = false;
        self.errors.push(error);
    }
}

#[derive(Debug, Serialize, Clone)] // Make Cloneable if needed by errors.clone()
pub struct ValidationError {
    pub code: String,
    pub message: String,
    pub location: Option<String>, // e.g., "column: column_name"
}

impl ValidationError {
    pub fn data_source_error(message: String) -> Self {
        Self {
            code: "DATA_SOURCE_ERROR".to_string(),
            message,
            location: None,
        }
    }

    pub fn internal_error(message: String) -> Self {
        Self {
            code: "INTERNAL_ERROR".to_string(),
            message,
            location: None,
        }
    }

    // Add other factory methods if they were used (e.g., table_not_found, column_not_found)
    // fn table_not_found(table_name: &str) -> Self {
    //     Self {
    //         code: "TABLE_NOT_FOUND".to_string(),
    //         message: format!("Table '{}' not found in data source.", table_name),
    //         location: None,
    //     }
    // }
    // fn column_not_found(column_name: &str) -> Self {
    //     Self {
    //         code: "COLUMN_NOT_FOUND".to_string(),
    //         message: format!("Column '{}' not found in table.", column_name),
    //         location: Some(format!("column: {}", column_name)),
    //     }
    // }
}
// --- End Local Struct Definitions --- 

// --- Dataset Deployment Specific Request/Response Structs ---

#[derive(Debug, Deserialize, Clone, Serialize)] // Added Serialize for potential use, Clone for handler
pub struct DeployDatasetsRequest {
    pub id: Option<Uuid>,
    pub data_source_name: String,
    pub env: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: String,
    pub model: Option<String>,
    pub schema: String,
    pub database: Option<String>,
    pub description: String,
    pub sql_definition: Option<String>,
    pub entity_relationships: Option<Vec<DeployDatasetsEntityRelationshipsRequest>>,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
    pub yml_file: Option<String>,
    pub database_identifier: Option<String>,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct DeployDatasetsColumnsRequest {
    pub name: String,
    pub description: String,
    pub semantic_type: Option<String>,
    pub expr: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub agg: Option<String>,
    #[serde(default)]
    pub searchable: bool,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct DeployDatasetsEntityRelationshipsRequest {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub type_: String,
}

// --- End Local Struct Definitions --- 