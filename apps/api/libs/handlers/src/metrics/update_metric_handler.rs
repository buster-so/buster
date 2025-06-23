use anyhow::{anyhow, bail, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{AssetPermissionRole, AssetType, DataSourceType, IdentityType, Verification},
    helpers::metric_files::fetch_metric_file_with_permissions,
    models::{Dataset, MetricFile, MetricFileToDataset},
    pool::get_pg_pool,
    schema::{data_sources, datasets, metric_files, metric_files_to_datasets},
    types::{
        ColumnLabelFormat, ColumnMetaData, ColumnType, DataMetadata, MetricYml, SimpleType,
        VersionContent, VersionHistory,
    },
};
use dataset_security::has_all_datasets_access;
use diesel::{insert_into, AsChangeset, ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use indexmap;
use middleware::AuthenticatedUser;
use query_engine::data_source_query_routes::query_engine::query_engine;
use serde_json::Value;
use sharing::check_permission_access;
use sql_analyzer::{analyze_query, types::TableKind};
use tracing::{debug, error, warn};
use uuid::Uuid;

/// Recursively merges two JSON objects.
/// The second object (update) takes precedence over the first (base) where there are conflicts.
///
/// # Arguments
/// * `base` - The base JSON value, typically the existing configuration
/// * `update` - The update JSON value containing fields to update
///
/// # Returns
/// * `Result<Value>` - The merged JSON value or an error
fn merge_json_objects(base: Value, update: Value) -> Result<Value> {
    match (base, update) {
        // If both are objects, merge them recursively
        (Value::Object(mut base_map), Value::Object(update_map)) => {
            for (key, value) in update_map {
                match base_map.get_mut(&key) {
                    // If key exists in both, recursively merge the values
                    Some(base_value) => {
                        *base_value = merge_json_objects(base_value.clone(), value)?;
                    }
                    // If key only exists in update, just insert it
                    None => {
                        base_map.insert(key, value);
                    }
                }
            }
            Ok(Value::Object(base_map))
        }
        // For arrays, replace the entire array
        (_, update @ Value::Array(_)) => Ok(update),
        // For any other type, just replace the value
        (_, update) => Ok(update),
    }
}

use crate::metrics::get_metric_handler::get_metric_handler;
use crate::metrics::types::BusterMetric;

#[derive(Debug, serde::Deserialize, serde::Serialize, Default)]
pub struct UpdateMetricRequest {
    #[serde(alias = "title")]
    pub name: Option<String>,
    pub description: Option<String>,
    pub chart_config: Option<Value>,
    pub time_frame: Option<String>,
    #[serde(alias = "status")]
    pub verification: Option<database::enums::Verification>,
    pub file: Option<String>,
    pub sql: Option<String>,
    pub update_version: Option<bool>,
    pub restore_to_version: Option<i32>,
}

/// Handler to update a metric by ID
///
/// This handler updates a metric file in the database and increments its version number.
/// Each time a metric is updated, the previous version is saved in the version history.
///
/// # Arguments
/// * `metric_id` - The UUID of the metric to update
/// * `user_id` - The UUID of the user making the update
/// * `request` - The update request containing the fields to modify
///
/// # Returns
/// * `Result<BusterMetric>` - The updated metric on success, or an error
///
/// # Versioning
/// The function automatically handles versioning:
/// 1. Retrieves the current metric and extracts its content
/// 2. Updates the content based on the request parameters
/// 3. Increments the version number (based on the number of existing versions)
/// 4. Adds the updated content to the version history with the new version number
/// 5. Saves both the updated content and version history to the database
///
pub async fn update_metric_handler(
    metric_id: &Uuid,
    user: &AuthenticatedUser,
    request: UpdateMetricRequest,
) -> Result<BusterMetric> {
    let mut conn = get_pg_pool()
        .get()
        .await
        .map_err(|e| anyhow!("Failed to get database connection: {}", e))?;

    // First, check if the user has access to the metric with the right permission level
    let metric_file_with_permissions = fetch_metric_file_with_permissions(metric_id, &user.id)
        .await
        .map_err(|e| anyhow!("Failed to fetch metric file with permissions: {}", e))?;

    let (permission, organization_id) =
        if let Some(file_with_permission) = metric_file_with_permissions {
            (
                file_with_permission.permission,
                file_with_permission.metric_file.organization_id,
            )
        } else {
            return Err(anyhow!("Metric file not found"));
        };

    // Verify the user has at least Editor, FullAccess, or Owner permission
    if !check_permission_access(
        permission,
        &[
            AssetPermissionRole::CanEdit,
            AssetPermissionRole::FullAccess,
            AssetPermissionRole::Owner,
        ],
        organization_id,
        &user.organizations,
    ) {
        return Err(anyhow!(
            "You don't have permission to update this metric. Editor or higher role required."
        ));
    }

    // Fetch the *current* MetricFile record (needed for version history & base content)
    let current_metric_file_record = metric_files::table
        .find(metric_id)
        .first::<MetricFile>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to fetch current metric file record: {}", e))?;

    let mut current_version_history = current_metric_file_record.version_history.clone();
    let data_source_id: Option<Uuid> = Some(current_metric_file_record.data_source_id); // Start with existing

    // --- Determine Content to Save ---
    let mut final_content: MetricYml = if let Some(version_number) = request.restore_to_version {
        // ... restore logic (doesn't change dataset handling directly here) ...
        // Parse the YAML content from the version
        match &current_version_history
            .get_version(version_number)
            .ok_or_else(|| anyhow!("Version {} not found", version_number))?
            .content
        {
            VersionContent::MetricYml(ref metric_yml) => (**metric_yml).clone(),
            _ => return Err(anyhow!("Invalid version content type")),
        }
    } else if let Some(ref file_content) = request.file {
        serde_yaml::from_str::<MetricYml>(&file_content)?
    } else {
        // Parse current content and apply individual updates
        let mut current_content = current_metric_file_record.content.clone();
        if let Some(description) = request.description {
            current_content.description = Some(description);
        }
        if let Some(chart_config) = request.chart_config {
            /* ... merge logic ... */
            let existing_config = serde_json::to_value(&current_content.chart_config)?;
            let merged_config = merge_json_objects(existing_config, chart_config)?;
            current_content.chart_config = serde_json::from_value(merged_config)?;
        }
        if let Some(time_frame) = request.time_frame {
            current_content.time_frame = time_frame;
        }
        // REMOVE: dataset_ids update logic
        if let Some(title) = request.name {
            current_content.name = title;
        }
        if let Some(ref sql) = request.sql {
            current_content.sql = sql.clone();
        }
        current_content
    };

    // --- SQL Validation, Dataset ID Extraction, and Metadata Calculation ---
    let mut data_metadata: Option<DataMetadata> = current_metric_file_record.data_metadata; // Default to existing
    let mut validated_dataset_ids: Vec<Uuid> = Vec::new(); // Store validated IDs for association
    let requires_revalidation =
        request.sql.is_some() || request.file.is_some() || request.restore_to_version.is_some();

    if requires_revalidation {
        let data_source_dialect = match data_sources::table
            .filter(data_sources::id.eq(data_source_id.unwrap()))
            .select(data_sources::type_)
            .first::<DataSourceType>(&mut conn)
            .await
        {
            Ok(dialect) => dialect.to_string(),
            Err(e) => return Err(anyhow!("Failed to fetch data source dialect: {}", e)),
        };

        // 1. Analyze SQL to get table names
        let analysis_result = analyze_query(final_content.sql.clone(), &data_source_dialect).await?;
        let table_names: Vec<String> = analysis_result
            .tables
            .into_iter()
            .filter(|t| t.kind == TableKind::Base)
            .map(|t| t.table_identifier.clone())
            .collect();

        if !table_names.is_empty() {
            // Need a data source ID to find datasets. If it wasn't set before, error out.
            let ds_id = data_source_id.ok_or_else(|| {
                anyhow!("Cannot validate SQL without a data source ID associated with the metric")
            })?;

            // 2. Find corresponding Datasets
            let found_datasets = datasets::table
                .filter(datasets::data_source_id.eq(ds_id))
                .filter(datasets::name.eq_any(&table_names))
                .filter(datasets::deleted_at.is_null())
                .load::<Dataset>(&mut conn)
                .await?;

            let current_dataset_ids: Vec<Uuid> = found_datasets.iter().map(|ds| ds.id).collect();

            // 3. Check Permissions
            if !current_dataset_ids.is_empty() {
                if !has_all_datasets_access(&user.id, &current_dataset_ids).await? {
                    bail!("Permission denied: User {} does not have access to one or more datasets required by the updated query: {:?}", user.id, table_names);
                }
                validated_dataset_ids = current_dataset_ids; // Store these IDs for association
            } else {
                warn!("Tables {:?} mentioned in updated query not found as datasets for data source {}", table_names, ds_id);
                // Decide if this is an error or not. For now, allow update but associate no datasets.
                validated_dataset_ids.clear();
            }

            // 4. Execute Query for Metadata (using the same data_source_id)
            match query_engine(&ds_id, &final_content.sql, Some(100)).await {
                Ok(query_result) => {
                    data_metadata = Some(query_result.metadata.clone());
                    // Update column formats based on new metadata
                    // ... (existing format update logic using query_result.metadata) ...
                    let default_formats_map: indexmap::IndexMap<String, ColumnLabelFormat> =
                        ColumnLabelFormat::generate_formats_from_metadata(&query_result.metadata);
                    let base_chart_config = match &mut final_content.chart_config {
                        // ... cases ...
                        database::types::ChartConfig::Bar(config) => &mut config.base,
                        database::types::ChartConfig::Line(config) => &mut config.base,
                        database::types::ChartConfig::Scatter(config) => &mut config.base,
                        database::types::ChartConfig::Pie(config) => &mut config.base,
                        database::types::ChartConfig::Combo(config) => &mut config.base,
                        database::types::ChartConfig::Metric(config) => &mut config.base,
                        database::types::ChartConfig::Table(config) => &mut config.base,
                    };
                    let existing_formats_map = base_chart_config.column_label_formats.clone();
                    base_chart_config.column_settings = None; // Clear old settings
                    if let Some(trendlines) = &mut base_chart_config.trendlines {
                        trendlines.clear();
                    }
                    let mut final_formats_map = indexmap::IndexMap::new();
                    for (column_name, new_default_format) in default_formats_map {
                        let final_format = match existing_formats_map.get(&column_name) {
                            Some(existing_format) => {
                                let new_default_value =
                                    serde_json::to_value(new_default_format.clone())?;
                                let existing_value = serde_json::to_value(existing_format.clone())?;
                                let merged_value =
                                    merge_json_objects(new_default_value, existing_value)?;
                                serde_json::from_value::<ColumnLabelFormat>(merged_value)
                                    .unwrap_or(new_default_format)
                            }
                            None => new_default_format,
                        };
                        final_formats_map.insert(column_name, final_format);
                    }
                    base_chart_config.column_label_formats = final_formats_map;
                }
                Err(e) => {
                    // SQL failed validation during metadata calculation
                    return Err(anyhow!("Updated SQL failed validation: {}", e));
                }
            }
        } else {
            // SQL uses no tables, clear associations and existing metadata
            validated_dataset_ids.clear();
            data_metadata = None; // No tables means no column metadata
        }
    } else {
        // SQL didn't change, fetch existing associations for the *current* version
        let current_version = current_version_history.get_version_number();
        validated_dataset_ids = metric_files_to_datasets::table
            .filter(metric_files_to_datasets::metric_file_id.eq(metric_id))
            .filter(metric_files_to_datasets::metric_version_number.eq(current_version))
            .select(metric_files_to_datasets::dataset_id)
            .load::<Uuid>(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to fetch current dataset associations: {}", e))?;
    }

    // --- Version History Update ---
    let next_version;
    let should_update_version = request.update_version.unwrap_or(true);
    if should_update_version {
        next_version = current_version_history
            .get_latest_version()
            .map_or(1, |v| v.version_number + 1);
        current_version_history.add_version(next_version, final_content.clone());
    } else {
        next_version = current_version_history.get_version_number(); // Keep current version number
        current_version_history.update_latest_version(final_content.clone());
    }
    let latest_version_number = current_version_history.get_version_number(); // Get potentially updated latest version

    // --- Database Update ---
    let content_json = serde_json::to_value(final_content.clone())?;

    #[derive(AsChangeset)]
    #[diesel(table_name = metric_files)]
    struct MetricFileChangeset {
        name: String,
        content: serde_json::Value,
        updated_at: DateTime<Utc>,
        version_history: VersionHistory,
        verification: Option<Verification>,
        data_metadata: Option<DataMetadata>,
        // data_source_id is not changed here, assumed to be set on creation
    }
    let changeset = MetricFileChangeset {
        name: final_content.name.clone(),
        content: content_json,
        updated_at: Utc::now(),
        version_history: current_version_history,
        verification: request.verification, // Use verification from request
        data_metadata,
    };

    diesel::update(metric_files::table)
        .filter(metric_files::id.eq(metric_id))
        .filter(metric_files::deleted_at.is_null())
        .set(changeset)
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to update metric file record: {}", e))?;

    // --- Update Dataset Associations for the NEW/UPDATED version ---
    let now = Utc::now();
    let new_associations: Vec<MetricFileToDataset> = validated_dataset_ids
        .into_iter()
        .map(|ds_id| MetricFileToDataset {
            metric_file_id: *metric_id,
            dataset_id: ds_id,
            metric_version_number: latest_version_number, // Associate with the final version number
            created_at: now, // Use now as creation time for this association record
        })
        .collect();

    // Delete existing associations for this specific version number first
    // Important if overwriting the latest version (update_version=false)
    diesel::delete(
        metric_files_to_datasets::table
            .filter(metric_files_to_datasets::metric_file_id.eq(metric_id))
            .filter(metric_files_to_datasets::metric_version_number.eq(latest_version_number)),
    )
    .execute(&mut conn)
    .await
    .map_err(|e| {
        anyhow!(
            "Failed to clear old dataset associations for version {}: {}",
            latest_version_number,
            e
        )
    })?;

    // Insert new associations
    if !new_associations.is_empty() {
        insert_into(metric_files_to_datasets::table)
            .values(&new_associations)
            .on_conflict_do_nothing() // Should ideally not happen due to delete, but safe
            .execute(&mut conn)
            .await
            .map_err(|e| {
                anyhow!(
                    "Failed to insert new dataset associations for version {}: {}",
                    latest_version_number,
                    e
                )
            })?;
    }

    // Return the updated metric (latest version)
    get_metric_handler(metric_id, user, None, None).await
}

#[cfg(test)]
mod tests {
    use database::types::{ColumnMetaData, ColumnType, DataMetadata, SimpleType};
    use serde_json::json;

    use super::*;

    #[test]
    fn test_update_metric_request_validation() {
        // Test the request struct validation without making actual DB calls

        // Create a request with valid UUID format for dataset_ids
        let valid_request = UpdateMetricRequest {
            name: Some("Valid Title".to_string()),
            description: Some("Valid Description".to_string()),
            chart_config: Some(serde_json::json!({
                "chartType": "bar",
                "config": { "showLegend": true }
            })),
            time_frame: Some("daily".to_string()),
            verification: Some(database::enums::Verification::NotRequested),
            file: None,
            sql: None,
            update_version: None,
            restore_to_version: None,
        };

        // Verify the request fields are properly structured
        assert_eq!(valid_request.name.unwrap(), "Valid Title");
        assert_eq!(valid_request.description.unwrap(), "Valid Description");
        assert_eq!(valid_request.time_frame.unwrap(), "daily");
        assert!(valid_request.chart_config.is_some());

        // Verify the verification field is properly passed through
        assert_eq!(
            valid_request.verification.unwrap(),
            database::enums::Verification::NotRequested
        );

        // Actual validation logic is tested in integration tests
    }

    #[test]
    fn test_restore_version_request() {
        // Test restoration request validation
        let restore_request = UpdateMetricRequest {
            restore_to_version: Some(1),
            name: Some("This should be ignored".to_string()),
            description: Some("This should be ignored".to_string()),
            chart_config: None,
            time_frame: None,
            verification: None,
            file: None,
            sql: None,
            update_version: None,
        };

        // Verify the request fields are properly structured
        assert_eq!(restore_request.restore_to_version.unwrap(), 1);
        assert_eq!(restore_request.name.unwrap(), "This should be ignored");
    }

    #[test]
    fn test_verification_in_update_request() {
        // Test that verification field is included in update request
        let request = UpdateMetricRequest {
            verification: Some(database::enums::Verification::Verified),
            ..Default::default()
        };

        // Verify the verification field is set correctly
        assert_eq!(
            request.verification.unwrap(),
            database::enums::Verification::Verified
        );
    }

    #[test]
    fn test_chart_config_partial_update() {
        // This test verifies that partial chart_config updates only change specified fields

        // Create a mock existing chart_config
        let existing_config = serde_json::json!({
            "selectedChartType": "bar",
            "colors": ["#1f77b4", "#ff7f0e"],
            "show_legend": true,
            "grid_lines": true,
            "bar_and_line_axis": {
                "x": ["date"],
                "y": ["value"]
            },
            "columnLabelFormats": {
                "date": {
                    "columnType": "date",
                    "style": "date"
                },
                "value": {
                    "columnType": "number",
                    "style": "number"
                }
            }
        });

        // Create a partial chart_config update that only changes specific fields
        let partial_config = serde_json::json!({
            "selectedChartType": "bar",  // Same as before
            "colors": ["#ff0000", "#00ff00"],  // Changed
            "show_legend": false,  // Changed
            "columnLabelFormats": {
                // Update just one entry
                "value": {
                    "style": "currency"  // Only changing style, columnType should be preserved
                }
            }
        });

        // Apply the deep merge
        let updated_config =
            merge_json_objects(existing_config.clone(), partial_config.clone()).unwrap();

        // Verify the updated config has the expected changes

        // Changed fields should have new values
        assert_eq!(updated_config["colors"][0], "#ff0000");
        assert_eq!(updated_config["colors"][1], "#00ff00");
        assert_eq!(updated_config["show_legend"], false);

        // Unchanged fields should retain original values
        assert_eq!(updated_config["grid_lines"], true);
        assert_eq!(updated_config["bar_and_line_axis"]["x"][0], "date");
        assert_eq!(updated_config["bar_and_line_axis"]["y"][0], "value");

        // Verify nested column formats are correctly merged
        assert_eq!(
            updated_config["columnLabelFormats"]["date"]["columnType"],
            "date"
        );
        assert_eq!(
            updated_config["columnLabelFormats"]["date"]["style"],
            "date"
        );

        // This entry should be partially updated - style changed but columnType preserved
        assert_eq!(
            updated_config["columnLabelFormats"]["value"]["columnType"],
            "number"
        );
        assert_eq!(
            updated_config["columnLabelFormats"]["value"]["style"],
            "currency"
        );
    }

    #[test]
    fn test_merge_json_objects() {
        // Test basic object merging
        let base = serde_json::json!({
            "a": 1,
            "b": 2
        });
        let update = serde_json::json!({
            "b": 3,
            "c": 4
        });

        let result = merge_json_objects(base, update).unwrap();
        assert_eq!(result["a"], 1);
        assert_eq!(result["b"], 3);
        assert_eq!(result["c"], 4);

        // Test nested object merging
        let base = serde_json::json!({
            "nested": {
                "x": 1,
                "y": 2
            },
            "other": "value"
        });
        let update = serde_json::json!({
            "nested": {
                "y": 3,
                "z": 4
            }
        });

        let result = merge_json_objects(base, update).unwrap();
        assert_eq!(result["nested"]["x"], 1); // Preserved from base
        assert_eq!(result["nested"]["y"], 3); // Updated
        assert_eq!(result["nested"]["z"], 4); // Added from update
        assert_eq!(result["other"], "value"); // Preserved from base

        // Test array replacement
        let base = serde_json::json!({
            "arr": [1, 2, 3]
        });
        let update = serde_json::json!({
            "arr": [4, 5]
        });

        let result = merge_json_objects(base, update).unwrap();
        assert_eq!(result["arr"], serde_json::json!([4, 5])); // Array is replaced, not merged
    }

    #[test]
    fn test_update_column_formats_from_metadata() {
        // Create a mock existing chart_config with some existing column formats
        let existing_config = serde_json::json!({
            "selectedChartType": "bar",
            "columnLabelFormats": {
                "existing_column": {
                    "columnType": "number",
                    "style": "currency",
                    "currency": "USD"
                }
            }
        });

        // Create a test DataMetadata with two columns - one existing and one new
        let metadata = DataMetadata {
            column_count: 2,
            row_count: 10,
            column_metadata: vec![
                ColumnMetaData {
                    name: "existing_column".to_string(),
                    min_value: json!(0),
                    max_value: json!(100),
                    unique_values: 10,
                    simple_type: SimpleType::Number,
                    column_type: ColumnType::Float8,
                },
                ColumnMetaData {
                    name: "new_column".to_string(),
                    min_value: json!("2023-01-01"),
                    max_value: json!("2023-12-31"),
                    unique_values: 12,
                    simple_type: SimpleType::Date,
                    column_type: ColumnType::Date,
                },
            ],
        };

        // Generate default column formats
        let default_formats = ColumnLabelFormat::generate_formats_from_metadata(&metadata);

        // Convert to JSON for merging
        let column_formats_json = serde_json::to_value(&default_formats).unwrap();
        let format_update = serde_json::json!({
            "columnLabelFormats": column_formats_json
        });

        // Merge with existing config
        let merged_config = merge_json_objects(existing_config, format_update).unwrap();

        // Verify the merged config

        // Check that existing column kept its custom currency format
        assert_eq!(
            merged_config["columnLabelFormats"]["existing_column"]["style"],
            "currency"
        );
        assert_eq!(
            merged_config["columnLabelFormats"]["existing_column"]["currency"],
            "USD"
        );

        // Check that new column has the default date format
        assert_eq!(
            merged_config["columnLabelFormats"]["new_column"]["columnType"],
            "date"
        );
        assert_eq!(
            merged_config["columnLabelFormats"]["new_column"]["style"],
            "date"
        );
        assert_eq!(
            merged_config["columnLabelFormats"]["new_column"]["dateFormat"],
            "auto"
        );
    }
}
