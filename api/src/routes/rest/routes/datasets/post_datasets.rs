use anyhow::{anyhow, Result};
use axum::{extract::Json, Extension};
use chrono::{DateTime, Utc};
use diesel::{upsert::excluded, ExpressionMethods, QueryDsl, SelectableHelper};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashSet;
use tokio::task::JoinSet;
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
        clients::typesense,
        query_engine::{
            credentials::get_data_source_credentials,
            import_dataset_columns::retrieve_dataset_columns,
        },
        user::user_info::get_user_organization_id,
    },
};

#[derive(Debug, Deserialize)]
pub struct PostDatasetsRequest {
    pub data_source_name: String,
    pub env: String,
    pub name: String,
    pub model: Option<String>,
    pub schema: String,
    pub description: String,
    pub sql_definition: Option<String>,
    pub entity_relationships: Option<Vec<PostDatasetsEntityRelationshipsRequest>>,
    pub columns: Vec<PostDatasetsColumnsRequest>,
}

#[derive(Debug, Deserialize)]
pub struct PostDatasetsColumnsRequest {
    pub name: String,
    pub description: String,
    pub semantic_type: Option<String>,
    pub expr: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub agg: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PostDatasetsEntityRelationshipsRequest {
    pub name: String,
    pub expr: String,
    #[serde(rename = "type")]
    pub type_: String,
}

#[derive(Serialize)]
pub struct PostDatasetsResponse {
    pub ids: Vec<Uuid>,
}

pub async fn post_datasets(
    Extension(user): Extension<User>,
    Json(request): Json<Vec<PostDatasetsRequest>>,
) -> Result<ApiResponse<PostDatasetsResponse>, (axum::http::StatusCode, String)> {
    let _ = match post_datasets_handler(&user.id, request).await {
        Ok(dataset) => dataset,
        Err(e) => {
            tracing::error!("Error creating dataset: {:?}", e);
            return Err((axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    Ok(ApiResponse::OK)
}

async fn post_datasets_handler(user_id: &Uuid, requests: Vec<PostDatasetsRequest>) -> Result<()> {
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
    let mut datasets = Vec::new();

    for req in &requests {
        let data_source = data_sources
            .iter()
            .find(|data_source| {
                data_source.name == req.data_source_name && data_source.env == req.env
            })
            .ok_or(anyhow!("Data source not found"))?;

        let dataset = Dataset {
            id: Uuid::new_v4(),
            name: req.name.clone(),
            data_source_id: data_source.id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            database_name: req.name.clone(),
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
        };

        datasets.push(dataset);
    }

    // Upsert the datasets into the database.
    let inserted_datasets = diesel::insert_into(datasets::table)
        .values(&datasets)
        .on_conflict((datasets::database_name, datasets::data_source_id))
        .do_update()
        .set((
            datasets::name.eq(excluded(datasets::name)),
            datasets::data_source_id.eq(excluded(datasets::data_source_id)),
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
        .map_err(|e| anyhow!("Failed to create dataset: {}", e))?;

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

    println!("columns_to_upsert: {:?}", columns_to_upsert);

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

    println!("inserted_datasets: {:?}", inserted_datasets);

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

    // TODO: Need to send back the updated and inserated objects.
    Ok(())
}
