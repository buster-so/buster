use anyhow::Result;
use diesel::{
    deserialize::FromSql,
    pg::Pg,
    serialize::{IsNull, Output, ToSql},
    sql_types::Jsonb,
    AsExpression, FromSqlRow,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Write;
use uuid::Uuid;
use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    static ref DASHBOARD_NAME_DESC_RE: Regex = Regex::new(r#"^(\s*(?:name|description):\s*)(.*)$"#).unwrap();
}

#[derive(Debug, Serialize, Deserialize, Clone, FromSqlRow, AsExpression)]
#[diesel(sql_type = Jsonb)]
#[serde(rename_all = "camelCase")]
pub struct DashboardYml {
    #[serde(alias = "name")]
    pub name: String,
    
    #[serde(alias = "description")]
    pub description: Option<String>,
    
    #[serde(alias = "rows")]
    pub rows: Vec<Row>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Row {
    pub items: Vec<RowItem>, // max number of items in a row is 4, min is 1
    
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(alias = "row_height")]
    pub row_height: Option<u32>, // max is 550, min is 320
    
    #[serde(alias = "column_sizes")]
    pub column_sizes: Vec<u32>, // sum of elements must be exactly 12, min size is 3
    
    #[serde(alias = "id")]
    pub id: u32, // incremental id for rows
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RowItem {
    // This id is the id of the metric or item reference that goes here in the dashboard.
    #[serde(alias = "id")]
    pub id: Uuid,
}

impl DashboardYml {
    pub fn new(yml_content: String) -> Result<Self> {
        let processed_yml_content = yml_content
            .lines()
            .map(|line| {
                if let Some(captures) = DASHBOARD_NAME_DESC_RE.captures(line) {
                    let key_part = captures.get(1).map_or("", |m| m.as_str());
                    let value_part = captures.get(2).map_or("", |m| m.as_str());
                    let sanitized_value = value_part.replace(':', ""); 
                    format!("{}{}", key_part, sanitized_value)
                } else {
                    line.to_string()
                }
            })
            .collect::<Vec<String>>()
            .join("\n");

        let mut file: DashboardYml = match serde_yaml::from_str(&processed_yml_content) {
            Ok(file) => file,
            Err(e) => return Err(anyhow::anyhow!("Error parsing YAML: {}", e)),
        };

        if file.name.is_empty() {
            file.name = String::from("New Dashboard");
        }

        for (index, row) in file.rows.iter_mut().enumerate() {
            if row.id == 0 {
                row.id = (index + 1) as u32;
            }
        }

        match file.validate() {
            Ok(_) => Ok(file),
            Err(e) => Err(anyhow::anyhow!("Error compiling file: {}", e)),
        }
    }

    pub fn validate(&self) -> Result<()> {
        if self.name.is_empty() {
            return Err(anyhow::anyhow!("Dashboard file name is required"));
        }

        for row in &self.rows {
            if let Some(row_height) = row.row_height {
                if !(320..=550).contains(&row_height) {
                    return Err(anyhow::anyhow!(
                        "Row height must be between 320 and 550, got {}",
                        row_height
                    ));
                }
            }

            if row.items.is_empty() || row.items.len() > 4 {
                return Err(anyhow::anyhow!(
                    "Number of items in row must be between 1 and 4, got {}",
                    row.items.len()
                ));
            }

            if row.column_sizes.is_empty() || row.column_sizes.len() > 4 {
                return Err(anyhow::anyhow!(
                    "Number of column sizes must be between 1 and 4, got {}",
                    row.column_sizes.len()
                ));
            }

            if row.column_sizes.len() != row.items.len() {
                return Err(anyhow::anyhow!(
                    "Number of column sizes ({}) must match number of items ({})",
                    row.column_sizes.len(),
                    row.items.len()
                ));
            }

            let sum: u32 = row.column_sizes.iter().sum();
            if sum != 12 {
                return Err(anyhow::anyhow!(
                    "Sum of column sizes must be exactly 12, got {}",
                    sum
                ));
            }

            for &size in &row.column_sizes {
                if size < 3 {
                    return Err(anyhow::anyhow!(
                        "Each column size must be at least 3, got {}",
                        size
                    ));
                }
            }
        }

        Ok(())
    }

    pub fn to_value(&self) -> Result<Value> {
        serde_json::to_value(self)
            .map_err(|e| anyhow::anyhow!("Failed to serialize dashboard yml: {}", e))
    }
    
    pub fn get_next_row_id(&self) -> u32 {
        self.rows
            .iter()
            .map(|row| row.id)
            .max()
            .map_or(1, |max_id| max_id + 1)
    }
    
    pub fn add_row(&mut self, items: Vec<RowItem>, row_height: Option<u32>, column_sizes: Vec<u32>) {
        let next_id = self.get_next_row_id();
        self.rows.push(Row {
            items,
            row_height,
            column_sizes,
            id: next_id,
        });
    }
}

impl FromSql<Jsonb, Pg> for DashboardYml {
    fn from_sql(bytes: diesel::pg::PgValue) -> diesel::deserialize::Result<Self> {
        let value = <serde_json::Value as FromSql<Jsonb, Pg>>::from_sql(bytes)?;
        Ok(serde_json::from_value(value)?)
    }
}

impl ToSql<Jsonb, Pg> for DashboardYml {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, Pg>) -> diesel::serialize::Result {
        out.write_all(&[1])?;
        out.write_all(&serde_json::to_vec(self)?)?;
        Ok(IsNull::No)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_dashboard_yml_camel_case_serialization() {
        let dashboard = DashboardYml {
            name: "Test Dashboard".to_string(),
            description: Some("This is a test dashboard".to_string()),
            rows: vec![
                Row {
                    items: vec![
                        RowItem {
                            id: Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap(),
                        }
                    ],
                    row_height: Some(400),
                    column_sizes: vec![12],
                    id: 1,
                }
            ],
        };
        
        let json = serde_json::to_value(&dashboard).unwrap();
        
        assert!(json.get("name").is_some());
        assert!(json.get("description").is_some());
        assert!(json.get("rows").is_some());
        
        let row = &json["rows"][0];
        assert!(row.get("items").is_some());
        assert!(row.get("rowHeight").is_some());
        assert!(row.get("columnSizes").is_some());
        assert!(row.get("id").is_some());
        
        assert!(row.get("row_height").is_none());
        assert!(row.get("column_sizes").is_none());
    }
    
    #[test]
    fn test_dashboard_yml_snake_case_deserialization() {
        let json = json!({
            "name": "Test Dashboard",
            "description": "This is a test dashboard",
            "rows": [
                {
                    "id": 1,
                    "items": [
                        {
                            "id": "00000000-0000-0000-0000-000000000001"
                        }
                    ],
                    "row_height": 400,
                    "column_sizes": [12]
                }
            ]
        });
        
        let yaml = serde_yaml::to_string(&json).unwrap();
        let dashboard = DashboardYml::new(yaml).unwrap();
        
        assert_eq!(dashboard.name, "Test Dashboard");
        assert_eq!(dashboard.description, Some("This is a test dashboard".to_string()));
        assert_eq!(dashboard.rows.len(), 1);
        assert_eq!(dashboard.rows[0].row_height, Some(400));
        assert_eq!(dashboard.rows[0].column_sizes, vec![12]);
        
        assert_eq!(dashboard.rows[0].id, 1);
    }
    

    #[test]
    fn test_dashboard_yml_camel_case_deserialization() {
        let json = json!({
            "name": "Test Dashboard",
            "description": "This is a test dashboard",
            "rows": [
                {
                    "id": 1,
                    "items": [
                        {
                            "id": "00000000-0000-0000-0000-000000000001"
                        }
                    ],
                    "rowHeight": 400,
                    "columnSizes": [12]
                }
            ]
        });
        
        let yaml = serde_yaml::to_string(&json).unwrap();
        let dashboard = DashboardYml::new(yaml).unwrap();
        
        assert_eq!(dashboard.name, "Test Dashboard");
        assert_eq!(dashboard.description, Some("This is a test dashboard".to_string()));
        assert_eq!(dashboard.rows.len(), 1);
        assert_eq!(dashboard.rows[0].row_height, Some(400));
        assert_eq!(dashboard.rows[0].column_sizes, vec![12]);
        
        assert_eq!(dashboard.rows[0].id, 1);
    }
    
    #[test]
    fn test_row_id_generation() {
        let yaml = r#"
name: Test Dashboard
description: This is a test dashboard
rows:
  - id: 0
    items:
      - id: 00000000-0000-0000-0000-000000000001
    rowHeight: 400
    columnSizes: [12]
  - id: 0
    items:
      - id: 00000000-0000-0000-0000-000000000002
    rowHeight: 320
    columnSizes: [12]
  - id: 0
    items:
      - id: 00000000-0000-0000-0000-000000000003
    rowHeight: 550
    columnSizes: [12]
"#;
        
        let dashboard = DashboardYml::new(yaml.to_string()).unwrap();
        
        assert_eq!(dashboard.rows[0].id, 1);
        assert_eq!(dashboard.rows[1].id, 2);
        assert_eq!(dashboard.rows[2].id, 3);
    }
    
    #[test]
    fn test_add_row_method() {
        let mut dashboard = DashboardYml {
            name: "Test Dashboard".to_string(),
            description: None,
            rows: vec![
                Row {
                    items: vec![RowItem { id: Uuid::new_v4() }],
                    row_height: None,
                    column_sizes: vec![12],
                    id: 1,
                }
            ],
        };
        
        dashboard.add_row(
            vec![RowItem { id: Uuid::new_v4() }],
            Some(400),
            vec![12],
        );
        
        dashboard.add_row(
            vec![RowItem { id: Uuid::new_v4() }],
            Some(320),
            vec![12],
        );
        
        assert_eq!(dashboard.rows[0].id, 1);
        assert_eq!(dashboard.rows[1].id, 2);
        assert_eq!(dashboard.rows[2].id, 3);
        
        assert_eq!(dashboard.get_next_row_id(), 4);
    }
    
    #[test]
    fn test_non_sequential_row_ids() {
        let dashboard = DashboardYml {
            name: "Test Dashboard".to_string(),
            description: None,
            rows: vec![
                Row {
                    items: vec![RowItem { id: Uuid::new_v4() }],
                    row_height: None,
                    column_sizes: vec![12],
                    id: 1,
                },
                Row {
                    items: vec![RowItem { id: Uuid::new_v4() }],
                    row_height: None,
                    column_sizes: vec![12],
                    id: 5,
                },
                Row {
                    items: vec![RowItem { id: Uuid::new_v4() }],
                    row_height: None,
                    column_sizes: vec![12],
                    id: 3,
                }
            ],
        };
        
        assert_eq!(dashboard.get_next_row_id(), 6);
    }
    
    #[test]
    fn test_explicitly_provided_id() {
        let json = json!({
            "name": "Test Dashboard",
            "description": "This is a test dashboard",
            "rows": [
                {
                    "items": [
                        {
                            "id": "00000000-0000-0000-0000-000000000001"
                        }
                    ],
                    "rowHeight": 400,
                    "columnSizes": [12],
                    "id": 42
                }
            ]
        });
        
        let yaml = serde_yaml::to_string(&json).unwrap();
        let dashboard = DashboardYml::new(yaml).unwrap();
        
        assert_eq!(dashboard.rows[0].id, 42);
    }
}
