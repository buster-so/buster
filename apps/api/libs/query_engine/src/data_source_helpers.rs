use anyhow::{anyhow, Result};
use database::{
    pool::get_pg_pool,
    schema::datasets,
};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::collections::HashMap;

/// Response structure that maps dataset IDs to their data source IDs
#[derive(Debug, Serialize, Deserialize)]
pub struct DatasetWithDataSource {
    pub dataset_id: Uuid,
    pub data_source_id: Uuid,
    pub name: String,
}

/// Helper function to get data source IDs for an array of dataset IDs
///
/// # Arguments
///
/// * `dataset_ids` - An array of dataset UUIDs to lookup
///
/// # Returns
///
/// A Result containing a Vec of DatasetWithDataSource structs, each mapping a dataset ID to its data source ID
pub async fn get_data_sources_for_datasets(dataset_ids: &[Uuid]) -> Result<Vec<DatasetWithDataSource>> {
    if dataset_ids.is_empty() {
        return Ok(vec![]);
    }

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Failed to get database connection: {}", e)),
    };

    let datasets_result = datasets::table
        .filter(datasets::id.eq_any(dataset_ids))
        .filter(datasets::deleted_at.is_null())
        .select((
            datasets::id,
            datasets::data_source_id,
            datasets::name,
        ))
        .load::<(Uuid, Uuid, String)>(&mut conn)
        .await
        .map_err(|e| anyhow!("Error querying datasets: {}", e))?;

    // Map the results to the response structure
    let result = datasets_result
        .into_iter()
        .map(|(dataset_id, data_source_id, name)| {
            DatasetWithDataSource {
                dataset_id,
                data_source_id,
                name,
            }
        })
        .collect();

    Ok(result)
}

/// Helper function that returns a HashMap mapping dataset IDs to their data source IDs
/// 
/// # Arguments
///
/// * `dataset_ids` - An array of dataset UUIDs to lookup
///
/// # Returns
///
/// A Result containing a HashMap where keys are dataset IDs and values are data source IDs
pub async fn get_data_source_map_for_datasets(dataset_ids: &[Uuid]) -> Result<HashMap<Uuid, Uuid>> {
    let datasets = get_data_sources_for_datasets(dataset_ids).await?;
    
    let map = datasets
        .into_iter()
        .map(|ds| (ds.dataset_id, ds.data_source_id))
        .collect();
    
    Ok(map)
} 