// libs/stored_values/src/jobs.rs
use anyhow::{anyhow, Context, Result};
use chrono::Utc;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use query_engine::data_source_query_routes::query_engine::query_engine;
use tracing::{error, info, warn};
use uuid::Uuid;
use litellm::{EmbeddingRequest, LiteLLMClient};
use sqlx::QueryBuilder;

use database::{
    models::StoredValuesSyncJob,
    pool::{get_pg_pool, get_sqlx_pool},
    schema::stored_values_sync_jobs,
};

// query_engine imports
use query_engine::data_types::DataType;

const SYNC_CHUNK_LIMIT: i64 = 1000;

/// Sets up a new sync job record for a specific column in the `stored_values_sync_jobs` table.
///
/// Initializes the job with a 'pending' status and null `last_synced_at`.
pub async fn setup_sync_job(
    data_source_id: Uuid,
    database_name: String,
    schema_name: String,
    table_name: String,
    column_name: String,
) -> Result<()> {
    info!(
        %data_source_id,
        %database_name,
        %schema_name,
        %table_name,
        %column_name,
        "Setting up new stored values sync job"
    );

    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get DB connection for setting up sync job")?;

    // Check if a job with the same parameters already exists
    let existing_job_count = stored_values_sync_jobs::table
        .filter(stored_values_sync_jobs::data_source_id.eq(data_source_id))
        .filter(stored_values_sync_jobs::database_name.eq(&database_name))
        .filter(stored_values_sync_jobs::schema_name.eq(&schema_name))
        .filter(stored_values_sync_jobs::table_name.eq(&table_name))
        .filter(stored_values_sync_jobs::column_name.eq(&column_name))
        .count()
        .get_result::<i64>(&mut conn)
        .await
        .context("Failed to check for existing sync job")?;

    if existing_job_count > 0 {
        info!(
            %data_source_id,
            %database_name,
            %schema_name,
            %table_name,
            %column_name,
            "Sync job already exists for this column. Skipping creation."
        );
        return Ok(()); // Job already exists, no need to insert again
    }

    let new_job = StoredValuesSyncJob {
        id: Uuid::new_v4(),
        data_source_id,
        database_name,
        schema_name,
        table_name,
        column_name,
        last_synced_at: None,
        created_at: Utc::now(),
        status: "pending".to_string(),
        error_message: None,
    };

    diesel::insert_into(stored_values_sync_jobs::table)
        .values(&new_job)
        .execute(&mut conn)
        .await
        .context("Failed to insert new stored values sync job")?;

    info!(job_id = %new_job.id, "Successfully set up sync job");
    Ok(())
}

/// Fetches distinct values in chunks using query_engine, generates embeddings,
/// and inserts both into the corresponding searchable_column_values table.
///
/// It iterates through all distinct values by repeatedly querying with LIMIT and OFFSET.
/// It also updates the corresponding `stored_values_sync_jobs` record with status
/// (`in_progress`, `success`, `error`) and `last_synced_at` timestamps.
///
/// WARNING: Identifier quoting used is basic and may not be safe for all DBs/names.
pub async fn sync_distinct_values_chunk(
    data_source_id: Uuid,
    database_name: String,
    schema_name: String,
    table_name: String,
    column_name: String,
) -> Result<usize> {
    let job_id = {
        let pool = get_pg_pool();
        let mut conn = pool
            .get()
            .await
            .context("Failed to get DB connection for finding job ID")?;
        
        let find_job_result = stored_values_sync_jobs::table
            .filter(stored_values_sync_jobs::data_source_id.eq(data_source_id))
            .filter(stored_values_sync_jobs::database_name.eq(&database_name.to_lowercase()))
            .filter(stored_values_sync_jobs::schema_name.eq(&schema_name.to_lowercase()))
            .filter(stored_values_sync_jobs::table_name.eq(&table_name.to_lowercase()))
            .filter(stored_values_sync_jobs::column_name.eq(&column_name.to_lowercase()))
            .filter(stored_values_sync_jobs::status.eq("pending")) // Only pick up pending jobs
            .select(stored_values_sync_jobs::id)
            .order(stored_values_sync_jobs::created_at.desc()) // Get the most recent pending one
            .get_result::<Uuid>(&mut conn)
            .await;

        match find_job_result {
            Ok(id) => id,
            Err(diesel::NotFound) => {
                info!(
                    "No pending sync job found for data_source_id={}, database={}, schema={}, table={}, column={}. Nothing to sync.",
                    data_source_id, database_name, schema_name, table_name, column_name
                );
                return Ok(0); // No job found, so 0 items processed.
            }
            Err(e) => {
                error!(
                    "Failed to get pending sync job for data_source_id={}, database={}, schema={}, table={}, column={}: {}",
                    data_source_id, database_name, schema_name, table_name, column_name, e
                );
                return Err(anyhow::Error::new(e).context(format!(
                    "Failed to retrieve sync job details for data_source_id={}, database={}, schema={}, table={}, column={}",
                    data_source_id, database_name, schema_name, table_name, column_name
                )));
            }
        }
    };

    info!(
        %job_id,
        %data_source_id,
        %database_name,
        %schema_name,
        %table_name,
        %column_name,
        chunk_limit = SYNC_CHUNK_LIMIT,
        "Starting full sync of distinct values and embeddings for job"
    );

    // Set status to in_progress immediately
    if let Err(e) = update_job_status(job_id, "in_progress", None).await {
        error!(%job_id, "Failed to set job status to in_progress: {}. Aborting sync.", e);
        return Err(e); // Propagate the error
    }

    // Instantiate the LiteLLM Client
    let litellm_client = LiteLLMClient::new(
        secrets::get_secret("OPENAI_API_KEY").await.ok(),
        Some("https://api.openai.com/v1/".to_string()),
    );

    // Wrap the core sync logic in a closure or block to handle errors centrally
    let sync_result: Result<usize, anyhow::Error> = async {
        let app_db_pool = get_sqlx_pool();
        let target_schema_name = format!("ds_{}", data_source_id.to_string().replace('-', "_"));
        let target_table_name = "searchable_column_values".to_string(); // Define target table name

        let mut offset: i64 = 0;
        let mut total_inserted_count: usize = 0;

        loop {
            // 1. Fetch Chunk
            let distinct_sql = format!(
                "SELECT DISTINCT {col} FROM {db}.{schema}.{table} ORDER BY 1 NULLS LAST LIMIT {limit} OFFSET {offset}",
                col = column_name,
                db = database_name,
                schema = schema_name,
                table = table_name,
                limit = SYNC_CHUNK_LIMIT,
                offset = offset
            );

            info!(%job_id, current_offset = offset, "Executing distinct query chunk via query_engine: {}", distinct_sql);
            let query_result = query_engine(&data_source_id, &distinct_sql, None)
                .await
                .with_context(|| {
                    format!(
                        "query_engine failed for distinct query chunk on {}.{}.{} at offset {}",
                        schema_name,
                        table_name,
                        column_name,
                        offset
                    )
                })?;

            let fetched_count = query_result.data.len();
            if fetched_count == 0 {
                info!(%job_id, "Fetched 0 rows at offset {}, assuming end of data.", offset);
                break; // No more data
            }

            // Determine the result column key dynamically from the first row
            // Assumes query_engine returns consistent keys and only one column is selected.
            let result_column_key = query_result.data.get(0)
                .and_then(|first_row| first_row.keys().next().cloned())
                .ok_or_else(|| {
                    warn!(%job_id, "Query engine returned rows but could not determine result column key.");
                    // Pass the format string and job_id to anyhow!
                    anyhow!("Could not determine result column key for job_id={}", job_id)
                })?;

            info!(%job_id, %result_column_key, "Determined result column key for extraction");

            // 2. Extract Values for this Chunk
            let mut chunk_values_to_process: Vec<String> = Vec::with_capacity(fetched_count);
            for row_map in query_result.data {
                if let Some(value_opt) = row_map.get(&result_column_key).and_then(|dt| match dt {
                     DataType::Text(Some(v)) => Some(v.clone()),
                    DataType::Int2(Some(v)) => Some(v.to_string()),
                    DataType::Int4(Some(v)) => Some(v.to_string()),
                    DataType::Int8(Some(v)) => Some(v.to_string()),
                    DataType::Float4(Some(v)) => Some(v.to_string()),
                    DataType::Float8(Some(v)) => Some(v.to_string()),
                    DataType::Bool(Some(v)) => Some(v.to_string()),
                    DataType::Date(Some(v)) => Some(v.to_string()),
                    DataType::Timestamp(Some(v)) => Some(v.to_string()),
                    DataType::Timestamptz(Some(v)) => Some(v.to_string()),
                    DataType::Json(Some(v)) => Some(v.to_string()),
                    DataType::Uuid(Some(v)) => Some(v.to_string()),
                    DataType::Decimal(Some(v)) => Some(v.to_string()),
                    DataType::Time(Some(v)) => Some(v.to_string()),
                    _ => None,
                }) {
                    if !value_opt.trim().is_empty() {
                        chunk_values_to_process.push(value_opt);
                    } else {
                        warn!(%job_id, "Skipping empty or whitespace-only string value in chunk.");
                    }
                } else {
                    warn!(%job_id, %result_column_key, ?row_map, "Could not extract valid string value using determined key, skipping.");
                }
            }

            // 3. Check if Empty Chunk (after extraction)
            if chunk_values_to_process.is_empty() {
                info!(%job_id, fetched_in_chunk = fetched_count, "No non-null, non-empty string values extracted in this chunk at offset {}. Moving to next chunk.", offset);
                // Still need to check if the *fetched* count means end of data
                if (fetched_count as i64) < SYNC_CHUNK_LIMIT {
                    info!(%job_id, "Fetched less than limit ({}) rows at offset {}, assuming end of data.", fetched_count, offset);
                    break;
                }
                offset += SYNC_CHUNK_LIMIT;
                continue; // Move to the next chunk
            }

            // 4. Embed Chunk
            info!(%job_id, count = chunk_values_to_process.len(), "Generating embeddings for chunk...");
            let embedding_request = EmbeddingRequest {
                model: "text-embedding-3-small".to_string(),
                input: chunk_values_to_process.clone(), // Clone values needed for embedding request
                dimensions: Some(1536),
                encoding_format: Some("float".to_string()),
                user: None,
            };

            let embedding_response = litellm_client
                .generate_embeddings(embedding_request)
                .await
                .context("Failed to generate embeddings via LiteLLMClient for chunk")?;

            // 5. Check Embedding Count for Chunk
            if chunk_values_to_process.len() != embedding_response.data.len() {
                warn!(
                    %job_id,
                    input_count = chunk_values_to_process.len(),
                    output_count = embedding_response.data.len(),
                    "Mismatch between input count and embedding count for chunk. Skipping insertion for this chunk."
                );
                // Still check if fetched_count indicates end of data
                if (fetched_count as i64) < SYNC_CHUNK_LIMIT {
                     info!(%job_id, "Fetched less than limit ({}) rows at offset {}, assuming end of data.", fetched_count, offset);
                    break;
                }
                offset += SYNC_CHUNK_LIMIT;
                continue; // Skip insertion for this chunk and move to the next
            }

            // 6. Prepare Insert Data for Chunk
            let values_with_formatted_embeddings: Vec<(String, String)> = chunk_values_to_process // Use original chunk values
                .into_iter()
                .zip(embedding_response.data.into_iter())
                .map(|(value, embedding_data)| {
                    let embedding_str = format!(
                        "[{}]",
                        embedding_data
                            .embedding
                            .iter()
                            .map(|f| f.to_string())
                            .collect::<Vec<String>>()
                            .join(",")
                    );
                    (value, embedding_str)
                })
                .collect();

            // 7. Build & Execute Insert for Chunk
            // Initialize QueryBuilder for each chunk to avoid growing indefinitely
            let mut query_builder: QueryBuilder<sqlx::Postgres> = QueryBuilder::new(format!(
                r#"INSERT INTO "{}"."{}" (value, database_name, schema_name, table_name, column_name, synced_at, embedding) VALUES "#,
                target_schema_name, target_table_name
            ));

            let mut first_row = true;
            for (value, embedding_str) in values_with_formatted_embeddings.iter() {
                if !first_row {
                    query_builder.push(", ");
                }
                query_builder.push("(");
                query_builder.push_bind(value);
                query_builder.push(", ");
                query_builder.push_bind(&database_name); // Use original names for insertion metadata
                query_builder.push(", ");
                query_builder.push_bind(&schema_name);
                query_builder.push(", ");
                query_builder.push_bind(&table_name);
                query_builder.push(", ");
                query_builder.push_bind(&column_name);
                query_builder.push(", ");
                query_builder.push_bind(Utc::now());
                query_builder.push(", ");
                query_builder.push("CAST(");
                query_builder.push_bind(embedding_str);
                query_builder.push(" AS halfvec)");
                query_builder.push(")");
                first_row = false;
            }

            query_builder.push(" ON CONFLICT DO NOTHING");

            let query = query_builder.build();

            info!(%job_id, row_count = values_with_formatted_embeddings.len(), "Executing batch insert for chunk...");
            match query.execute(app_db_pool).await {
                Ok(rows_affected) => {
                    let current_chunk_inserted = rows_affected.rows_affected() as usize;
                    total_inserted_count += current_chunk_inserted; // Accumulate total count
                    info!(
                        %job_id,
                        inserted_in_chunk = current_chunk_inserted,
                        total_inserted = total_inserted_count,
                        fetched_in_chunk = fetched_count,
                        values_processed_in_chunk = values_with_formatted_embeddings.len(),
                        current_offset = offset,
                        target_table = format!("{}.{}", target_schema_name, target_table_name),
                        "Processed distinct values chunk with embeddings"
                    );
                }
                Err(e) => {
                    error!(%job_id, "Database insert failed for chunk: {:?}", e);
                    // Propagate error to mark the job as failed
                    return Err(anyhow::Error::new(e).context(format!(
                        "Failed to insert distinct values chunk with embeddings into {}.{}",
                        target_schema_name, target_table_name
                    )));
                }
            }

            // 8. Update Count & Offset (or break)
            if (fetched_count as i64) < SYNC_CHUNK_LIMIT {
                info!(%job_id, "Fetched less than limit ({}) rows at offset {}, assuming end of data after processing chunk.", fetched_count, offset);
                break; // End of data
            }

            offset += SYNC_CHUNK_LIMIT; // Move to the next chunk offset
        } // End loop

        Ok(total_inserted_count)
    }.await;

    // Update status based on the result of the sync logic
    match sync_result {
        Ok(count) => {
            info!(%job_id, total_inserted_count = count, "Finished syncing distinct values and embeddings successfully.");
            // Update status to success
            if let Err(e) = update_job_status(job_id, "success", None).await {
                error!(%job_id, "Failed to set job status to success: {}", e);
                // Even though sync succeeded, we failed to update status, return error
                Err(e)
            } else {
                Ok(count)
            }
        }
        Err(e) => {
            error!(%job_id, "Syncing distinct values and embeddings failed: {}", e);
            // Update status to error and store the message
            let error_message = e.to_string();
            if let Err(update_err) = update_job_status(job_id, "error", Some(error_message)).await {
                error!(%job_id, "Additionally failed to set job status to error: {}", update_err);
                // Log both errors, but return the original sync error
                Err(anyhow!(
                    "Sync failed: {}. Also failed to update job status: {}",
                    e,
                    update_err
                ))
            } else {
                // Return the original sync error
                Err(e)
            }
        }
    }
}

/// Updates the status, last_synced_at, and optional error message for a sync job.
async fn update_job_status(
    job_id: Uuid,
    status: &str,
    error_message: Option<String>,
) -> Result<()> {
    info!(%job_id, %status, ?error_message, "Updating sync job status");

    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get DB connection for updating sync job status")?;

    let current_time = Utc::now();

    diesel::update(stored_values_sync_jobs::table.find(job_id))
        .set((
            stored_values_sync_jobs::status.eq(status.to_string()),
            stored_values_sync_jobs::last_synced_at.eq(Some(current_time)),
            stored_values_sync_jobs::error_message.eq(error_message),
        ))
        .execute(&mut conn)
        .await
        .with_context(|| format!("Failed to update sync job status for job_id: {}", job_id))?;

    info!(%job_id, %status, "Successfully updated sync job status");
    Ok(())
}

/// Scans for sync jobs that are pending or haven't been successfully synced in the last 24 hours,
/// and triggers the sync process for each identified job in a separate background task.
pub async fn trigger_stale_sync_jobs() -> Result<()> {
    info!("Scanning for stale or pending stored values sync jobs...");

    let pool = get_pg_pool();
    let mut conn = pool
        .get()
        .await
        .context("Failed to get DB connection for scanning stale jobs")?;

    let twenty_four_hours_ago = Utc::now() - chrono::Duration::hours(24);

    // Find jobs that were last synced > 24h ago and are not 'in_progress' or 'error'
    // Also include jobs that are 'pending' and have never been synced (last_synced_at is NULL),
    // or are 'pending' and their creation time implies they might have been missed.
    // For simplicity with Diesel, we can query broadly and then filter in code, or make a more complex query.
    // The current query correctly gets jobs that have a last_synced_at > 24h ago and are not in_progress/error.
    // To include 'pending' jobs regardless of last_synced_at (as they should be picked up),
    // the logic inside the loop will handle ensuring they are 'pending'.
    let jobs_to_sync = stored_values_sync_jobs::table
        .filter(
            stored_values_sync_jobs::last_synced_at
                .lt(twenty_four_hours_ago)
                .or(stored_values_sync_jobs::last_synced_at.is_null()) // Also consider jobs never synced
                .and(stored_values_sync_jobs::status.ne("in_progress"))
                .and(stored_values_sync_jobs::status.ne("error")),
        )
        .load::<StoredValuesSyncJob>(&mut conn)
        .await
        .context("Failed to load sync jobs from database")?;

    let count = jobs_to_sync.len();
    info!("Found {} jobs to potentially sync based on age or pending status.", count);

    for job in jobs_to_sync {
        info!(job_id = %job.id, status = %job.status, last_synced_at = ?job.last_synced_at, "Considering job: {}", job.column_name);

        let mut job_is_ready_to_sync = job.status == "pending";

        // If the job is eligible (old or never synced, and not in_progress/error)
        // and not already pending, mark it as 'pending'.
        if !job_is_ready_to_sync &&
           (job.last_synced_at.map_or(true, |lsa| lsa < twenty_four_hours_ago) && // Explicitly check age here too
            job.status != "in_progress" && job.status != "error") {
            info!(job_id = %job.id, old_status = %job.status, "Marking stale/eligible job as pending for re-sync.");
            match diesel::update(stored_values_sync_jobs::table.find(job.id))
                .set(stored_values_sync_jobs::status.eq("pending".to_string()))
                // Do not update last_synced_at here; sync_distinct_values_chunk handles it.
                .execute(&mut conn)
                .await
            {
                Ok(num_updated) => {
                    if num_updated > 0 {
                        info!(job_id = %job.id, "Successfully marked stale/eligible job as pending.");
                        job_is_ready_to_sync = true;
                    } else {
                        warn!(job_id = %job.id, "Failed to mark stale/eligible job as pending (0 rows updated). It might have been deleted or changed concurrently.");
                    }
                }
                Err(e) => {
                    error!(job_id = %job.id, "DB error while marking stale/eligible job as pending: {}. Skipping this job.", e);
                }
            }
        }

        // Now, if the job is 'pending' (either originally or just updated), spawn the sync task.
        if job_is_ready_to_sync {
            info!(job_id = %job.id, status = "pending", "Spawning sync task for job: {}", job.column_name);

            // Clone the necessary data for the async task
            let ds_id = job.data_source_id;
            let db_name = job.database_name.clone();
            let sch_name = job.schema_name.clone();
            let tbl_name = job.table_name.clone();
            let col_name = job.column_name.clone();
            let job_id_for_task = job.id; // Capture job_id for logging inside task

            tokio::spawn(async move {
                info!(%job_id_for_task, "Background sync task started.");
                match sync_distinct_values_chunk(ds_id, db_name, sch_name, tbl_name, col_name).await {
                    Ok(inserted_count) => {
                        info!(%job_id_for_task, %inserted_count, "Background sync task completed successfully.");
                    }
                    Err(e) => {
                        error!(%job_id_for_task, "Background sync task failed: {}", e);
                        // Note: sync_distinct_values_chunk already updates the job status to 'error'
                    }
                }
            });
        }
    }

    info!("Finished considering {} jobs for sync tasks.", count);
    Ok(())
}

// Potential future functions:
// pub async fn get_pending_sync_jobs(...) -> Result<Vec<StoredValuesSyncJob>> { ... }
