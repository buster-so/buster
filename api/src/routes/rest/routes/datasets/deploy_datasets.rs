use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_yaml;
use std::collections::HashSet;
use uuid::Uuid;

use crate::{
    database::{
        enums::DatasetType,
        lib::get_pg_pool,
        models::{DataSource, Dataset, DatasetColumn, EntityRelationship, User},
        schema::{data_sources, dataset_columns, datasets, entity_relationship},
    },
    routes::rest::ApiResponse,
    utils::{
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::retrieve_dataset_columns,
            write_query_engine::write_query_engine,
        }, security::checks::is_user_workspace_admin_or_data_admin, user::user_info::get_user_organization_id
    },
};

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum DeployDatasetsRequest {
    Full(Vec<FullDeployDatasetsRequest>),
    Simple { id: Uuid, sql: String, yml: String },
}

#[derive(Debug, Deserialize)]
pub struct FullDeployDatasetsRequest {
    pub id: Option<Uuid>,
    pub data_source_name: String,
    pub env: String,
    #[serde(rename = "type")]
    pub type_: String,
    pub name: String,
    pub model: Option<String>,
    pub schema: String,
    pub description: String,
    pub sql_definition: Option<String>,
    pub entity_relationships: Option<Vec<DeployDatasetsEntityRelationshipsRequest>>,
    pub columns: Vec<DeployDatasetsColumnsRequest>,
    pub yml_file: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsColumnsRequest {
    pub name: String,
    pub description: String,
    pub semantic_type: Option<String>,
    pub expr: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub agg: Option<String>,
    #[serde(default)]
    pub stored_values: bool,
}

#[derive(Debug, Deserialize)]
pub struct DeployDatasetsEntityRelationshipsRequest {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Serialize)]
pub struct DeployDatasetsResponse {
    pub ids: Vec<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct BusterModel {
    pub version: i32,
    pub models: Vec<Model>,
}

#[derive(Debug, Deserialize)]
pub struct Model {
    pub name: String,
    pub data_source_name: String,
    pub schema: String,
    pub env: String,
    pub description: String,
    pub model: Option<String>,
    #[serde(rename = "type")]
    pub type_: String,
    pub entities: Vec<Entity>,
    pub dimensions: Vec<Dimension>,
    pub measures: Vec<Measure>,
}

#[derive(Debug, Deserialize)]
pub struct Entity {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub entity_type: String,
}

#[derive(Debug, Deserialize)]
pub struct Dimension {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub dimension_type: String,
    pub description: String,
}

#[derive(Debug, Deserialize)]
pub struct Measure {
    pub name: String,
    pub expr: String,
    pub agg: String,
    pub description: String,
}

pub async fn deploy_datasets(
    Extension(user): Extension<User>,
    Json(request): Json<DeployDatasetsRequest>,
) -> Result<ApiResponse<DeployDatasetsResponse>, (axum::http::StatusCode, String)> {
    let organization_id = match get_user_organization_id(&user.id).await {
        Ok(id) => id,
        Err(e) => {
            tracing::error!("Error getting user organization id: {:?}", e);
            return Err((
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Error getting user organization id".to_string(),
            ));
        }
    };

    match is_user_workspace_admin_or_data_admin(&user, &organization_id).await {
        Ok(true) => (),
        Ok(false) => {
            return Err((
                axum::http::StatusCode::FORBIDDEN,
                "Insufficient permissions".to_string(),
            ))
        }
        Err(e) => {
            tracing::error!("Error checking user permissions: {:?}", e);
            return Err((axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    }

    let is_simple = match request {
        DeployDatasetsRequest::Full(_) => false,
        DeployDatasetsRequest::Simple { .. } => true,
    };

    let requests = match process_deploy_request(request).await {
        Ok(requests) => requests,
        Err(e) => {
            tracing::error!("Error processing deploy request: {:?}", e);
            return Err((axum::http::StatusCode::BAD_REQUEST, e.to_string()));
        }
    };

    let _ = match deploy_datasets_handler(&user.id, requests, is_simple).await {
        Ok(dataset) => dataset,
        Err(e) => {
            tracing::error!("Error creating dataset: {:?}", e);
            return Err((axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    Ok(ApiResponse::OK)
}

async fn process_deploy_request(
    request: DeployDatasetsRequest,
) -> Result<Vec<FullDeployDatasetsRequest>> {
    match request {
        DeployDatasetsRequest::Full(requests) => Ok(requests),
        DeployDatasetsRequest::Simple { id, sql, yml } => {
            let model: BusterModel = serde_yaml::from_str(&yml)?;
            let mut requests = Vec::new();

            for semantic_model in model.models {
                // Create the view in the data source
                let mut columns = Vec::new();

                // Process dimensions
                for dim in semantic_model.dimensions {
                    columns.push(DeployDatasetsColumnsRequest {
                        name: dim.name,
                        description: dim.description,
                        semantic_type: Some(String::from("dimension")),
                        expr: Some(dim.expr),
                        type_: Some(dim.dimension_type),
                        agg: None,
                        stored_values: false,
                    });
                }

                // Process measures
                for measure in semantic_model.measures {
                    columns.push(DeployDatasetsColumnsRequest {
                        name: measure.name,
                        description: measure.description,
                        semantic_type: Some(String::from("measure")),
                        expr: Some(measure.expr),
                        type_: None,
                        agg: Some(measure.agg),
                        stored_values: false,
                    });
                }

                // Process entity relationships
                let entity_relationships = semantic_model
                    .entities
                    .into_iter()
                    .map(|entity| DeployDatasetsEntityRelationshipsRequest {
                        name: entity.name,
                        expr: entity.expr,
                        type_: entity.entity_type,
                    })
                    .collect();

                requests.push(FullDeployDatasetsRequest {
                    id: Some(id),
                    data_source_name: semantic_model.data_source_name,
                    env: semantic_model.env,
                    type_: semantic_model.type_,
                    name: semantic_model.name,
                    model: semantic_model.model,
                    schema: semantic_model.schema,
                    description: semantic_model.description,
                    sql_definition: Some(sql.clone()),
                    entity_relationships: Some(entity_relationships),
                    columns,
                    yml_file: Some(yml.clone()),
                });
            }

            Ok(requests)
        }
    }
}

async fn deploy_datasets_handler(
    user_id: &Uuid,
    requests: Vec<FullDeployDatasetsRequest>,
    is_simple: bool,
) -> Result<()> {
    // Get the user organization id.
    let organization_id = get_user_organization_id(&user_id).await?;

    let pg_pool = get_pg_pool();

    let mut conn = match pg_pool.get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    // Verify data source exists and belongs to organization
    let data_sources = data_sources::table
        .filter(
            data_sources::name.eq_any(
                requests
                    .iter()
                    .map(|r| r.data_source_name.clone())
                    .collect::<Vec<String>>(),
            ),
        )
        .filter(
            data_sources::env.eq_any(
                requests
                    .iter()
                    .map(|r| r.env.clone())
                    .collect::<Vec<String>>(),
            ),
        )
        .filter(data_sources::organization_id.eq(organization_id))
        .filter(data_sources::deleted_at.is_null())
        .select(data_sources::all_columns)
        .load::<DataSource>(&mut conn)
        .await
        .map_err(|_| anyhow!("Data sources not found"))?;

    // Need to create the datasets, multiple datasets can be created at once.
    let mut datasets_with_ids = Vec::new();
    let mut datasets_without_ids = Vec::new();

    for req in &requests {
        let data_source = data_sources
            .iter()
            .find(|data_source| {
                data_source.name == req.data_source_name && data_source.env == req.env
            })
            .ok_or(anyhow!("Data source not found"))?;

        let database_name = req.name.replace(" ", "_");

        let dataset = Dataset {
            id: req.id.unwrap_or_else(|| Uuid::new_v4()),
            name: req.name.clone(),
            data_source_id: data_source.id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            database_name,
            when_to_use: Some(req.description.clone()),
            when_not_to_use: None,
            type_: DatasetType::View,
            definition: req
                .sql_definition
                .clone()
                .unwrap_or("NO DEFINITION FOUND".to_string()),
            schema: req.schema.clone(),
            enabled: true,
            created_by: user_id.to_owned(),
            updated_by: user_id.to_owned(),
            deleted_at: None,
            imported: false,
            organization_id,
            model: req.model.clone(),
            yml_file: req.yml_file.clone(),
        };

        match req.id {
            Some(_) => datasets_with_ids.push(dataset),
            None => datasets_without_ids.push(dataset),
        }
    }

    // Upsert the datasets into the database concurrently
    let (inserted_id_datasets, inserted_no_id_datasets) = tokio::try_join!(
        async {
            let mut conn = pg_pool.get().await?;
            diesel::insert_into(datasets::table)
                .values(&datasets_with_ids)
                .on_conflict(datasets::id)
                .do_update()
                .set((
                    datasets::name.eq(excluded(datasets::name)),
                    datasets::when_to_use.eq(excluded(datasets::when_to_use)),
                    datasets::definition.eq(excluded(datasets::definition)),
                    datasets::type_.eq(excluded(datasets::type_)),
                    datasets::schema.eq(excluded(datasets::schema)),
                    datasets::updated_at.eq(Utc::now()),
                    datasets::deleted_at.eq(None::<DateTime<Utc>>),
                ))
                .returning(Dataset::as_select())
                .get_results::<Dataset>(&mut conn)
                .await
                .map_err(|e| anyhow!("Failed to create dataset: {}", e))
        },
        async {
            let mut conn = pg_pool.get().await?;
            diesel::insert_into(datasets::table)
                .values(&datasets_without_ids)
                .on_conflict((datasets::database_name, datasets::data_source_id))
                .do_update()
                .set((
                    datasets::name.eq(excluded(datasets::name)),
                    datasets::when_to_use.eq(excluded(datasets::when_to_use)),
                    datasets::definition.eq(excluded(datasets::definition)),
                    datasets::type_.eq(excluded(datasets::type_)),
                    datasets::schema.eq(excluded(datasets::schema)),
                    datasets::updated_at.eq(Utc::now()),
                    datasets::deleted_at.eq(None::<DateTime<Utc>>),
                ))
                .returning(Dataset::as_select())
                .get_results::<Dataset>(&mut conn)
                .await
                .map_err(|e| anyhow!("Failed to create dataset: {}", e))
        }
    )?;

    let mut inserted_datasets = inserted_id_datasets;
    inserted_datasets.extend(inserted_no_id_datasets);
    // Upsert the dataset columns into the database. We will pull these from the data source for their types.

    let mut columns_to_upsert: Vec<DatasetColumn> = Vec::new();

    for req in &requests {
        let data_source = data_sources
            .iter()
            .find(|data_source| {
                data_source.name == req.data_source_name && data_source.env == req.env
            })
            .ok_or(anyhow!("Data source not found"))?;

        let dataset = inserted_datasets
            .iter()
            .find(|dataset| {
                dataset.name == req.name
                    && dataset.data_source_id == data_source.id
                    && dataset.schema == req.schema
            })
            .ok_or(anyhow!("Dataset not found"))?;

        let credentials =
            get_data_source_credentials(&data_source.secret_id, &data_source.type_, false)
                .await
                .map_err(|e| anyhow!("Error getting data source credentials: {}", e))?;

        let cols = retrieve_dataset_columns(&dataset.database_name, &dataset.schema, &credentials)
            .await
            .map_err(|e| anyhow!("Error retrieving dataset columns: {}", e))?;

        // First add columns from entity relationships if they exist
        if let Some(relationships) = &req.entity_relationships {
            for rel in relationships {
                // Skip if we already have this column
                if columns_to_upsert
                    .iter()
                    .any(|c| c.dataset_id == dataset.id && c.name == rel.expr)
                {
                    continue;
                }

                // Try to find column info from source
                let (col_type, nullable) = match cols.iter().find(|c| c.name == rel.expr) {
                    Some(col) => (col.type_.clone(), col.nullable),
                    None => ("".to_string(), true),
                };

                columns_to_upsert.push(DatasetColumn {
                    id: Uuid::new_v4(),
                    name: rel.expr.clone(),
                    description: None,
                    semantic_type: None,
                    dataset_id: dataset.id,
                    type_: col_type,
                    nullable,
                    created_at: Utc::now(),
                    updated_at: Utc::now(),
                    deleted_at: None,
                    stored_values: None,
                    stored_values_status: None,
                    stored_values_error: None,
                    stored_values_count: None,
                    stored_values_last_synced: None,
                    dim_type: None,
                    expr: Some(rel.expr.clone()),
                });
            }
        }

        // Then process regular columns as before
        for req_col in &req.columns {
            // Skip if we already have this column for this dataset
            if columns_to_upsert
                .iter()
                .any(|c| c.dataset_id == dataset.id && c.name == req_col.name)
            {
                continue;
            }

            // Try to find existing column info, but don't require it
            let (col_type, nullable) = match cols.iter().find(|c| match &req_col.expr {
                Some(expr) => c.name == *expr,
                None => c.name == req_col.name,
            }) {
                Some(col) => (col.type_.clone(), col.nullable),
                None => (req_col.type_.clone().unwrap_or("".to_string()), true),
            };

            columns_to_upsert.push(DatasetColumn {
                id: Uuid::new_v4(),
                name: req_col.expr.clone().unwrap_or(req_col.name.clone()),
                description: Some(req_col.description.clone()),
                semantic_type: req_col.semantic_type.clone(),
                dataset_id: dataset.id.clone(),
                type_: col_type,
                nullable,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                deleted_at: None,
                stored_values: None,
                stored_values_status: None,
                stored_values_error: None,
                stored_values_count: None,
                stored_values_last_synced: None,
                dim_type: req_col.type_.clone(),
                expr: req_col.expr.clone(),
            });
        }
    }

    // Dedupe columns based on dataset_id and name
    let columns_to_upsert: Vec<DatasetColumn> = {
        let mut seen = HashSet::new();
        columns_to_upsert
            .into_iter()
            .filter(|col| seen.insert((col.dataset_id, col.name.clone())))
            .collect()
    };

    let inserted_columns = diesel::insert_into(dataset_columns::table)
        .values(&columns_to_upsert)
        .on_conflict((dataset_columns::dataset_id, dataset_columns::name))
        .do_update()
        .set((
            dataset_columns::name.eq(excluded(dataset_columns::name)),
            dataset_columns::description.eq(excluded(dataset_columns::description)),
            dataset_columns::semantic_type.eq(excluded(dataset_columns::semantic_type)),
            dataset_columns::type_.eq(excluded(dataset_columns::type_)),
            dataset_columns::dim_type.eq(excluded(dataset_columns::dim_type)),
            dataset_columns::expr.eq(excluded(dataset_columns::expr)),
            dataset_columns::nullable.eq(excluded(dataset_columns::nullable)),
            dataset_columns::updated_at.eq(Utc::now()),
            dataset_columns::deleted_at.eq(None::<DateTime<Utc>>),
        ))
        .returning(DatasetColumn::as_select())
        .get_results::<DatasetColumn>(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to upsert dataset columns: {}", e))?;

    diesel::update(dataset_columns::table)
        .filter(
            dataset_columns::dataset_id.eq_any(
                inserted_columns
                    .iter()
                    .map(|c| c.dataset_id.clone())
                    .collect::<Vec<Uuid>>(),
            ),
        )
        .filter(
            dataset_columns::id.ne_all(
                inserted_columns
                    .iter()
                    .map(|c| c.id.clone())
                    .collect::<Vec<Uuid>>(),
            ),
        )
        .filter(dataset_columns::deleted_at.is_null())
        .set(dataset_columns::deleted_at.eq(Some(Utc::now())))
        .execute(&mut conn)
        .await
        .map_err(|e| anyhow!("Failed to update deleted_at for dataset columns: {}", e))?;

    // Handle entity relationships
    let mut entity_relationships_to_upsert: Vec<EntityRelationship> = Vec::new();

    for req in &requests {
        if let Some(relationships) = &req.entity_relationships {
            let current_dataset = inserted_datasets
                .iter()
                .find(|d| d.name == req.name)
                .ok_or(anyhow!("Dataset not found for relationships"))?;

            println!("current_dataset: {:?}", current_dataset);
            println!("relationships: {:?}", relationships);

            for rel in relationships {
                // Skip primary relationships
                if rel.type_ == "primary" {
                    continue;
                }

                // Find the foreign dataset by the relationship name
                let foreign_dataset = inserted_datasets
                    .iter()
                    .find(|d| d.name == rel.name)
                    .ok_or(anyhow!("Foreign dataset not found for relationship"))?;

                entity_relationships_to_upsert.push(EntityRelationship {
                    primary_dataset_id: current_dataset.id,
                    foreign_dataset_id: foreign_dataset.id,
                    relationship_type: rel.type_.clone(),
                    created_at: Utc::now(),
                });
            }
        }
    }

    // Dedupe relationships based on dataset pair
    let unique_relationships: Vec<EntityRelationship> = {
        let mut seen = HashSet::new();
        entity_relationships_to_upsert
            .into_iter()
            .filter(|er| seen.insert((er.primary_dataset_id, er.foreign_dataset_id)))
            .collect()
    };

    if !unique_relationships.is_empty() {
        diesel::insert_into(entity_relationship::table)
            .values(&unique_relationships)
            .on_conflict((
                entity_relationship::primary_dataset_id,
                entity_relationship::foreign_dataset_id,
            ))
            .do_update()
            .set((entity_relationship::relationship_type
                .eq(excluded(entity_relationship::relationship_type)),))
            .execute(&mut conn)
            .await
            .map_err(|e| anyhow!("Failed to upsert entity relationships: {}", e))?;
    }

    // After inserting columns, handle stored values
    for req in &requests {
        let data_source = data_sources
            .iter()
            .find(|data_source| {
                data_source.name == req.data_source_name && data_source.env == req.env
            })
            .ok_or(anyhow!("Data source not found"))?;

        let dataset = inserted_datasets
            .iter()
            .find(|dataset| {
                dataset.name == req.name
                    && dataset.data_source_id == data_source.id
                    && dataset.schema == req.schema
            })
            .ok_or(anyhow!("Dataset not found"))?;

        // Process columns that have stored_values enabled
        for col in &req.columns {
            if col.stored_values {
                // Find the column ID from inserted_columns
                let column = inserted_columns
                    .iter()
                    .find(|c| c.dataset_id == dataset.id && c.name == col.name)
                    .ok_or(anyhow!("Column not found"))?;

                match crate::utils::stored_values::store_column_values(
                    &organization_id,
                    &dataset.id,
                    &col.name,
                    &column.id,  // Pass the column ID
                    &data_source.id,
                    &dataset.schema,
                    &dataset.database_name,
                ).await {
                    Ok(_) => (),
                    Err(e) => {
                        tracing::error!(
                            "Error storing values for column {}: {:?}",
                            col.name,
                            e
                        );
                        // Continue with other columns even if one fails
                        continue;
                    }
                }
            }
        }
    }

    if is_simple {
        for dataset in inserted_datasets {
            let view_name = format!("{}.{}", dataset.schema, dataset.database_name);
            let view_sql = format!(
                "CREATE {} {} AS {}",
                dataset.type_.to_string(),
                view_name,
                dataset.definition
            );

            // Write the view to the data source
            write_query_engine(&dataset.id, &view_sql).await?;
        }
    }

    // TODO: Need to send back the updated and inserated objects.
    Ok(())
}
