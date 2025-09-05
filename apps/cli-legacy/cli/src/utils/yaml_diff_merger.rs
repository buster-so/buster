use std::path::PathBuf;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use serde_yaml::{Value, Mapping};
use anyhow::{Result, Context};
use std::fs;
use colored::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct YamlFile {
    pub models: Vec<Model>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Model {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub entities: Vec<Entity>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub dimensions: Vec<Dimension>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub measures: Vec<Measure>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct Entity {
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ref_: Option<String>,
    pub expr: String,
    #[serde(rename = "type")]
    pub entity_type: String,
    pub description: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project_path: Option<String>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct Dimension {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expr: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semantic_type: Option<String>,
    #[serde(default, skip_serializing_if = "should_skip_searchable")]
    pub searchable: Option<bool>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct Measure {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub expr: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agg: Option<String>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

#[derive(Debug)]
pub struct YamlDiffMerger {
    existing_yaml: PathBuf,
    new_content: String,
    backup_path: PathBuf,
}

#[derive(Debug)]
pub struct ModelDiff {
    added_dimensions: Vec<Dimension>,
    removed_dimensions: Vec<String>,
    added_measures: Vec<Measure>,
    removed_measures: Vec<String>,
    preserved_dimensions: Vec<Dimension>,
    preserved_measures: Vec<Measure>,
}

#[derive(Debug)]
pub struct DiffStats {
    total_dimensions: usize,
    total_measures: usize,
    added_dimensions: usize,
    added_measures: usize,
    removed_dimensions: usize,
    removed_measures: usize,
    preserved_dimensions: usize,
    preserved_measures: usize,
}

#[derive(Debug)]
pub struct DiffResult {
    changes: ModelDiff,
    statistics: DiffStats,
}

impl YamlDiffMerger {
    pub fn new(existing_yaml: PathBuf, new_content: String) -> Self {
        let backup_path = existing_yaml.with_extension("yml.bak");
        Self {
            existing_yaml,
            new_content,
            backup_path,
        }
    }

    fn parse_yaml_preserving_style(content: &str) -> Result<Value> {
        serde_yaml::from_str(content).context("Failed to parse YAML content")
    }

    fn update_model_preserving_style(&self, existing_model: &mut Value, new_model: &Model) -> Result<()> {
        if let Value::Mapping(map) = existing_model {
            // Update dimensions while preserving style
            if let Some(existing_dims) = map.get_mut("dimensions") {
                if let Value::Sequence(dims) = existing_dims {
                    // Create a map of existing dimensions by name (case insensitive)
                    let mut dim_map: HashMap<String, &Value> = HashMap::new();
                    for dim in dims.iter() {
                        if let Some(name) = dim.get("name").and_then(|n| n.as_str()) {
                            dim_map.insert(name.to_lowercase(), dim);
                        }
                    }

                    // Update dimensions while preserving order and style
                    let mut new_dims = Vec::new();
                    for dim in &new_model.dimensions {
                        if let Some(&existing_dim) = dim_map.get(&dim.name.to_lowercase()) {
                            // Preserve existing dimension's style and casing
                            new_dims.push(existing_dim.clone());
                        } else {
                            // Add new dimension
                            new_dims.push(serde_yaml::to_value(dim)?);
                        }
                    }
                    *dims = new_dims;
                }
            }

            // Update measures while preserving style
            if let Some(existing_measures) = map.get_mut("measures") {
                if let Value::Sequence(measures) = existing_measures {
                    // Create a map of existing measures by name (case insensitive)
                    let mut measure_map: HashMap<String, &Value> = HashMap::new();
                    for measure in measures.iter() {
                        if let Some(name) = measure.get("name").and_then(|n| n.as_str()) {
                            measure_map.insert(name.to_lowercase(), measure);
                        }
                    }

                    // Update measures while preserving order and style
                    let mut new_measures = Vec::new();
                    for measure in &new_model.measures {
                        if let Some(&existing_measure) = measure_map.get(&measure.name.to_lowercase()) {
                            // Preserve existing measure's style and casing
                            new_measures.push(existing_measure.clone());
                        } else {
                            // Add new measure
                            new_measures.push(serde_yaml::to_value(measure)?);
                        }
                    }
                    *measures = new_measures;
                }
            }
        }
        Ok(())
    }

    pub fn compute_diff(&self) -> Result<DiffResult> {
        // Read and parse existing YAML
        let existing_content = fs::read_to_string(&self.existing_yaml)
            .context(format!("Failed to read file: {}", self.existing_yaml.display()))?;
        
        let existing_yaml: YamlFile = match serde_yaml::from_str(&existing_content) {
            Ok(yaml) => yaml,
            Err(e) => {
                // Try to parse as raw YAML first to see if it's valid YAML at all
                match serde_yaml::from_str::<serde_yaml::Value>(&existing_content) {
                    Ok(_) => return Err(anyhow::anyhow!(
                        "File {} contains valid YAML but doesn't match expected structure. Error: {}",
                        self.existing_yaml.display(), e
                    )),
                    Err(_) => return Err(anyhow::anyhow!(
                        "File {} contains invalid YAML. Content:\n{}\nError: {}",
                        self.existing_yaml.display(), existing_content, e
                    )),
                }
            }
        };
        
        // Parse new YAML content
        let new_yaml: YamlFile = match serde_yaml::from_str(&self.new_content) {
            Ok(yaml) => yaml,
            Err(e) => {
                // Try to parse as raw YAML first to see if it's valid YAML at all
                match serde_yaml::from_str::<serde_yaml::Value>(&self.new_content) {
                    Ok(_) => return Err(anyhow::anyhow!(
                        "New content contains valid YAML but doesn't match expected structure. Error: {}",
                        e
                    )),
                    Err(_) => return Err(anyhow::anyhow!(
                        "New content contains invalid YAML. Content:\n{}\nError: {}",
                        self.new_content, e
                    )),
                }
            }
        };

        // Validate models array is not empty
        if existing_yaml.models.is_empty() {
            return Err(anyhow::anyhow!(
                "File {} contains no models", 
                self.existing_yaml.display()
            ));
        }
        if new_yaml.models.is_empty() {
            return Err(anyhow::anyhow!("New content contains no models"));
        }

        // Since we're dealing with a single model in the models array
        let existing_model = &existing_yaml.models[0];
        let new_model = &new_yaml.models[0];

        // Create maps for quick lookups
        let existing_dims: HashMap<_, _> = existing_model.dimensions.iter()
            .map(|d| (d.name.to_lowercase(), d)).collect();
        let existing_measures: HashMap<_, _> = existing_model.measures.iter()
            .map(|m| (m.name.to_lowercase(), m)).collect();
        let new_dims: HashMap<_, _> = new_model.dimensions.iter()
            .map(|d| (d.name.to_lowercase(), d)).collect();
        let new_measures: HashMap<_, _> = new_model.measures.iter()
            .map(|m| (m.name.to_lowercase(), m)).collect();

        let mut changes = ModelDiff {
            added_dimensions: Vec::new(),
            removed_dimensions: Vec::new(),
            added_measures: Vec::new(),
            removed_measures: Vec::new(),
            preserved_dimensions: Vec::new(),
            preserved_measures: Vec::new(),
        };

        // Process dimensions
        for (name, dim) in &new_dims {
            if existing_dims.contains_key(name) {
                changes.preserved_dimensions.push(existing_dims[name].clone());
            } else {
                changes.added_dimensions.push((*dim).clone());
            }
        }
        for (name, dim) in existing_dims.iter() {
            if !new_dims.contains_key(name) {
                changes.removed_dimensions.push(dim.name.clone());
            }
        }

        // Process measures
        for (name, measure) in &new_measures {
            if existing_measures.contains_key(name) {
                changes.preserved_measures.push(existing_measures[name].clone());
            } else {
                changes.added_measures.push((*measure).clone());
            }
        }
        for (name, measure) in existing_measures.iter() {
            if !new_measures.contains_key(name) {
                changes.removed_measures.push(measure.name.clone());
            }
        }

        let statistics = DiffStats {
            total_dimensions: existing_dims.len(),
            total_measures: existing_measures.len(),
            added_dimensions: changes.added_dimensions.len(),
            added_measures: changes.added_measures.len(),
            removed_dimensions: changes.removed_dimensions.len(),
            removed_measures: changes.removed_measures.len(),
            preserved_dimensions: changes.preserved_dimensions.len(),
            preserved_measures: changes.preserved_measures.len(),
        };

        Ok(DiffResult { changes, statistics })
    }

    pub fn preview_changes(&self, diff_result: &DiffResult) {
        println!("\nChanges to be applied:");
        println!("----------------------");

        if !diff_result.changes.added_dimensions.is_empty() {
            println!("\nNew dimensions to be added:");
            for dim in &diff_result.changes.added_dimensions {
                println!("  + {}", dim.name.green());
            }
        }

        if !diff_result.changes.added_measures.is_empty() {
            println!("\nNew measures to be added:");
            for measure in &diff_result.changes.added_measures {
                println!("  + {}", measure.name.green());
            }
        }

        if !diff_result.changes.removed_dimensions.is_empty() {
            println!("\nDimensions to be removed:");
            for name in &diff_result.changes.removed_dimensions {
                println!("  - {}", name.red());
            }
        }

        if !diff_result.changes.removed_measures.is_empty() {
            println!("\nMeasures to be removed:");
            for name in &diff_result.changes.removed_measures {
                println!("  - {}", name.red());
            }
        }

        if !diff_result.changes.preserved_dimensions.is_empty() {
            println!("\nPreserved dimensions (keeping existing configuration):");
            for dim in &diff_result.changes.preserved_dimensions {
                println!("  • {}", dim.name.yellow());
            }
        }

        if !diff_result.changes.preserved_measures.is_empty() {
            println!("\nPreserved measures (keeping existing configuration):");
            for measure in &diff_result.changes.preserved_measures {
                println!("  • {}", measure.name.yellow());
            }
        }

        println!("\nStatistics:");
        println!("  Dimensions:");
        println!("    Total: {}", diff_result.statistics.total_dimensions);
        println!("    Added: {}", diff_result.statistics.added_dimensions);
        println!("    Removed: {}", diff_result.statistics.removed_dimensions);
        println!("    Preserved: {}", diff_result.statistics.preserved_dimensions);
        println!("  Measures:");
        println!("    Total: {}", diff_result.statistics.total_measures);
        println!("    Added: {}", diff_result.statistics.added_measures);
        println!("    Removed: {}", diff_result.statistics.removed_measures);
        println!("    Preserved: {}", diff_result.statistics.preserved_measures);
    }

    pub fn apply_changes(&self, diff_result: &DiffResult) -> Result<()> {
        // Create backup
        fs::copy(&self.existing_yaml, &self.backup_path)
            .context("Failed to create backup file")?;

        // Read existing YAML preserving style
        let existing_content = fs::read_to_string(&self.existing_yaml)
            .context("Failed to read existing YAML file")?;
        let mut existing_yaml = Self::parse_yaml_preserving_style(&existing_content)?;

        // Parse new content
        let new_yaml: YamlFile = serde_yaml::from_str(&self.new_content)
            .context("Failed to parse new YAML content")?;

        // Update the existing YAML while preserving style
        if let Value::Mapping(map) = &mut existing_yaml {
            if let Some(Value::Sequence(models)) = map.get_mut("models") {
                if !models.is_empty() {
                    // Update the first model
                    self.update_model_preserving_style(&mut models[0], &new_yaml.models[0])?;
                }
            }
        }

        // Write to temporary file using the original style
        let temp_path = self.existing_yaml.with_extension("yml.tmp");
        let yaml_str = serde_yaml::to_string(&existing_yaml)?;
        fs::write(&temp_path, yaml_str)
            .context("Failed to write temporary file")?;

        // Atomic rename
        fs::rename(&temp_path, &self.existing_yaml)
            .context("Failed to apply changes")?;

        // Remove backup if successful
        fs::remove_file(&self.backup_path)
            .context("Failed to remove backup file")?;

        Ok(())
    }
}

// Add helper function at module level
fn should_skip_searchable(b: &Option<bool>) -> bool {
    b.is_none() || !b.unwrap()
} 