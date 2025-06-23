use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Debug)]
pub struct MessageSearchResult {
    pub id: Uuid,
    #[serde(rename = "name")]
    pub title: String,
    pub summary_question: String,
    pub updated_at: DateTime<Utc>,
    pub highlights: Vec<String>,
    pub score: f64,
    #[serde(rename = "type")]
    pub type_: SearchObjectType,
}

#[derive(Serialize, Debug)]
pub struct GenericSearchResult {
    pub id: Uuid,
    pub name: String,
    pub updated_at: DateTime<Utc>,
    pub highlights: Vec<String>,
    pub score: f64,
    #[serde(rename = "type")]
    pub type_: SearchObjectType,
}

#[derive(Serialize, Debug)]
#[serde(untagged)]
pub enum SearchObject {
    Message(MessageSearchResult),
    Collection(GenericSearchResult),
    Dashboard(GenericSearchResult),
    DataSource(GenericSearchResult),
    Dataset(GenericSearchResult),
    PermissionGroup(GenericSearchResult),
    Team(GenericSearchResult),
    Term(GenericSearchResult),
    Metric(GenericSearchResult),
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum SearchObjectType {
    Thread,
    Collection,
    Dashboard,
    DataSource,
    Dataset,
    PermissionGroup,
    Team,
    Term,
    Metric,
}

impl ToString for SearchObjectType {
    fn to_string(&self) -> String {
        match self {
            SearchObjectType::Thread => "thread".to_string(),
            SearchObjectType::Collection => "collection".to_string(),
            SearchObjectType::Dashboard => "dashboard".to_string(),
            SearchObjectType::DataSource => "data_source".to_string(),
            SearchObjectType::Dataset => "dataset".to_string(),
            SearchObjectType::PermissionGroup => "permission_group".to_string(),
            SearchObjectType::Team => "team".to_string(),
            SearchObjectType::Term => "term".to_string(),
            SearchObjectType::Metric => "metric".to_string(),
        }
    }
}

#[derive(Debug)]
pub struct SearchOptions {
    pub num_results: i64,
    pub asset_types: Vec<SearchObjectType>,
}

impl Default for SearchOptions {
    fn default() -> Self {
        SearchOptions {
            num_results: 10,
            asset_types: vec![],
        }
    }
}

impl SearchOptions {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_custom_options(num_results: i64, asset_types: Vec<SearchObjectType>) -> Self {
        SearchOptions {
            num_results,
            asset_types,
        }
    }

    pub fn asset_types_to_string(&self) -> String {
        if self.asset_types.is_empty() {
            // If no asset types specified, include all types
            return "'collection', 'dashboard', 'metric'".to_string();
        }
        
        self.asset_types
            .iter()
            .map(|t| format!("'{}'", t.to_string()))
            .collect::<Vec<_>>()
            .join(", ")
    }
}