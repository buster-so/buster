use crate::database::{lib::get_pg_pool, models::DatasetColumn, schema::dataset_columns};

use super::{
    credentials::{
        BigqueryCredentials, Credential, MySqlCredentials, PostgresCredentials,
        SnowflakeCredentials, RedshiftCredentials,
    },
    data_source_connections::{
        get_bigquery_client::get_bigquery_client, get_mysql_connection::get_mysql_connection,
        get_postgres_connection::get_postgres_connection,
        get_snowflake_client::get_snowflake_client,
        get_redshift_connection::get_redshift_connection,
    },
};
use anyhow::{anyhow, Result};
use arrow::array::Array;
use chrono::Utc;
use diesel::{insert_into, upsert::excluded, ExpressionMethods};
use diesel_async::RunQueryDsl;
use gcp_bigquery_client::model::query_request::QueryRequest;
use sqlx::{FromRow, Row};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct DatasetColumnRecord {
    pub dataset_name: String,
    pub schema_name: String,
    pub name: String,
    pub type_: String,
    pub nullable: bool,
    pub comment: Option<String>,
    pub source_type: String,
}

impl<'r> FromRow<'r, sqlx::postgres::PgRow> for DatasetColumnRecord {
    fn from_row(row: &'r sqlx::postgres::PgRow) -> std::result::Result<Self, sqlx::Error> {
        Ok(Self {
            dataset_name: row.try_get("dataset_name")?,
            schema_name: row.try_get("schema_name")?,
            name: row.try_get("name")?,
            type_: row.try_get("type_")?,
            nullable: row.try_get("nullable")?,
            comment: row.try_get("comment")?,
            source_type: row.try_get("source_type")?,
        })
    }
}

impl<'r> FromRow<'r, sqlx::mysql::MySqlRow> for DatasetColumnRecord {
    fn from_row(row: &'r sqlx::mysql::MySqlRow) -> std::result::Result<Self, sqlx::Error> {
        Ok(Self {
            dataset_name: row.try_get("dataset_name")?,
            schema_name: row.try_get("schema_name")?,
            name: row.try_get("name")?,
            type_: row.try_get("type_")?,
            nullable: row.try_get("nullable")?,
            comment: row.try_get("comment")?,
            source_type: row.try_get("source_type")?,
        })
    }
}

pub async fn import_dataset_columns(
    dataset_id: &Uuid,
    dataset_database_name: &String,
    dataset_schema_name: &String,
    credentials: &Credential,
    database: Option<String>,
) -> Result<()> {
    let cols =
        match retrieve_dataset_columns(&dataset_database_name, &dataset_schema_name, credentials, database)
            .await
        {
            Ok(cols) => cols,
            Err(e) => return Err(e),
        };

    // If no columns found, return error
    if cols.is_empty() {
        return Err(anyhow!("No columns found for dataset"));
    }

    match create_dataset_columns(dataset_id, &cols).await {
        Ok(_) => (),
        Err(e) => return Err(e),
    }

    Ok(())
}

async fn create_dataset_columns(dataset_id: &Uuid, cols: &[DatasetColumnRecord]) -> Result<()> {
    // Deduplicate columns by name before creating DatasetColumn records
    let mut seen = std::collections::HashSet::new();
    let dataset_columns: Vec<DatasetColumn> = cols
        .iter()
        .filter(|col| seen.insert(col.name.clone()))
        .map(|col| DatasetColumn {
            id: uuid::Uuid::new_v4(),
            dataset_id: dataset_id.clone(),
            name: col.name.clone(),
            type_: col.type_.clone(),
            description: col.comment.clone().filter(|s| !s.is_empty()),
            nullable: col.nullable,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            stored_values: None,
            stored_values_status: None,
            stored_values_error: None,
            stored_values_count: None,
            stored_values_last_synced: None,
            semantic_type: None,
            dim_type: None,
            expr: None,
        })
        .collect();

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    match insert_into(dataset_columns::table)
        .values(&dataset_columns)
        .on_conflict((dataset_columns::dataset_id, dataset_columns::name))
        .do_update()
        .set((
            dataset_columns::type_.eq(excluded(dataset_columns::type_)),
            dataset_columns::nullable.eq(excluded(dataset_columns::nullable)),
            dataset_columns::updated_at.eq(Utc::now()),
            dataset_columns::deleted_at.eq::<Option<chrono::NaiveDateTime>>(None),
        ))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error inserting dataset columns: {:?}", e)),
    }

    Ok(())
}

pub async fn retrieve_dataset_columns(
    dataset_name: &String,
    schema_name: &String,
    credentials: &Credential,
    database: Option<String>,
) -> Result<Vec<DatasetColumnRecord>> {
    let cols_result = match credentials {
        Credential::Postgres(credentials) => {
            match get_postgres_columns_batch(
                &[(dataset_name.clone(), schema_name.clone())],
                credentials,
            )
            .await
            {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        Credential::MySQL(credentials) => {
            match get_mysql_columns_batch(
                &[(dataset_name.clone(), schema_name.clone())],
                credentials,
            )
            .await
            {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        Credential::Bigquery(credentials) => {
            match get_bigquery_columns_batch(
                &[(dataset_name.clone(), schema_name.clone())],
                credentials,
            )
            .await
            {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        Credential::Snowflake(credentials) => {
            match get_snowflake_columns_batch(
                &[(dataset_name.clone(), schema_name.clone())],
                credentials,
                database,
            )
            .await
            {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        Credential::Redshift(credentials) => {
            match get_redshift_columns_batch(
                &[(dataset_name.clone(), schema_name.clone())],
                credentials,
            )
            .await
            {
                Ok(cols) => cols,
                Err(e) => return Err(e),
            }
        }
        _ => return Err(anyhow!("Unsupported data source type")),
    };

    Ok(cols_result)
}

pub async fn retrieve_dataset_columns_batch(
    datasets: &[(String, String)], // Vec of (dataset_name, schema_name)
    credentials: &Credential,
    database: Option<String>,
) -> Result<Vec<DatasetColumnRecord>> {
    match credentials {
        Credential::Postgres(credentials) => {
            get_postgres_columns_batch(datasets, credentials).await
        }
        Credential::MySQL(credentials) => get_mysql_columns_batch(datasets, credentials).await,
        Credential::Bigquery(credentials) => {
            get_bigquery_columns_batch(datasets, credentials).await
        }
        Credential::Snowflake(credentials) => {
            get_snowflake_columns_batch(datasets, credentials, database).await
        }
        Credential::Redshift(credentials) => {
            get_redshift_columns_batch(datasets, credentials).await
        }
        _ => Err(anyhow!("Unsupported data source type")),
    }
}

async fn get_snowflake_columns_batch(
    datasets: &[(String, String)],
    credentials: &SnowflakeCredentials,
    database: Option<String>,
) -> Result<Vec<DatasetColumnRecord>> {
    let mut credentials = credentials.clone();

    if let Some(database) = database {
        credentials.database_id = Some(database);
    }

    let snowflake_client = get_snowflake_client(&credentials).await?;

    // Build the IN clause for (schema, table) pairs
    let table_pairs: Vec<String> = datasets
        .iter()
        .map(|(table, schema)| format!("('{}', '{}')", schema.to_uppercase(), table.to_uppercase()))
        .collect();

    let table_pairs_str = table_pairs.join(", ");

    let sql = format!(
        "SELECT
            c.TABLE_NAME as dataset_name,
            c.TABLE_SCHEMA as schema_name,
            c.COLUMN_NAME AS name,
            c.DATA_TYPE AS type_,
            CASE WHEN c.IS_NULLABLE = 'YES' THEN true ELSE false END AS nullable,
            c.COMMENT AS comment,
            t.TABLE_TYPE as source_type
        FROM
            INFORMATION_SCHEMA.COLUMNS c
        JOIN 
            INFORMATION_SCHEMA.TABLES t 
            ON c.TABLE_NAME = t.TABLE_NAME 
            AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
        WHERE
            (c.TABLE_SCHEMA, c.TABLE_NAME) IN ({})
        ORDER BY 
            c.TABLE_SCHEMA,
            c.TABLE_NAME,
            c.ORDINAL_POSITION;",
        table_pairs_str
    );

    let results = snowflake_client
        .exec(&sql)
        .await
        .map_err(|e| anyhow!("Error executing batch query: {:?}", e))?;

    let mut columns = Vec::new();

    if let snowflake_api::QueryResult::Arrow(record_batches) = results {
        for batch in &record_batches {
            let schema = batch.schema();

            let dataset_name_index = schema.index_of("DATASET_NAME")?;
            let schema_name_index = schema.index_of("SCHEMA_NAME")?;
            let name_index = schema.index_of("NAME")?;
            let type_index = schema.index_of("TYPE_")?;
            let nullable_index = schema.index_of("NULLABLE")?;
            let comment_index = schema.index_of("COMMENT")?;
            let source_type_index = schema.index_of("SOURCE_TYPE")?;

            let dataset_name_array = batch
                .column(dataset_name_index)
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for DATASET_NAME"))?;
            let schema_name_array = batch
                .column(schema_name_index)
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for SCHEMA_NAME"))?;
            let name_array = batch
                .column(name_index)
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for NAME"))?;
            let type_array = batch
                .column(type_index)
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for TYPE_"))?;
            let nullable_array = batch
                .column(nullable_index)
                .as_any()
                .downcast_ref::<arrow::array::BooleanArray>()
                .ok_or_else(|| anyhow!("Expected BooleanArray for NULLABLE"))?;
            let comment_array = batch
                .column(comment_index)
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for COMMENT"))?;
            let source_type_array = batch
                .column(source_type_index)
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for SOURCE_TYPE"))?;

            for i in 0..batch.num_rows() {
                let dataset_name = dataset_name_array.value(i).to_string();
                let schema_name = schema_name_array.value(i).to_string();
                let name = name_array.value(i).to_string();
                let type_ = type_array.value(i).to_string();
                let nullable = nullable_array.value(i);
                let comment = if comment_array.is_null(i) {
                    None
                } else {
                    Some(comment_array.value(i).to_string())
                };
                let source_type = if source_type_array.is_null(i) {
                    "TABLE".to_string()
                } else {
                    source_type_array.value(i).to_string()
                };

                columns.push(DatasetColumnRecord {
                    dataset_name: dataset_name.to_lowercase(), // Convert to lowercase for consistent comparison
                    schema_name: schema_name.to_lowercase(),   // Convert to lowercase for consistent comparison
                    name,                                      // Keep column name as is
                    type_,
                    nullable,
                    comment,
                    source_type,
                });
            }
        }
    } else {
        return Err(anyhow!(
            "Unexpected query result format from Snowflake. Expected Arrow format."
        ));
    }

    Ok(columns)
}

async fn get_postgres_columns_batch(
    datasets: &[(String, String)],
    credentials: &PostgresCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    let (postgres_conn, child_process, tempfile) = match get_postgres_connection(credentials).await
    {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    // Build the IN clause for (schema, table) pairs
    let table_pairs: Vec<String> = datasets
        .iter()
        .map(|(table, schema)| format!("('{schema}', '{table}')"))
        .collect();
    let table_pairs_str = table_pairs.join(", ");

    // Query for tables and views
    let regular_sql = format!(
        "SELECT
            c.table_name as dataset_name,
            c.table_schema as schema_name,
            c.column_name as name,
            c.data_type as type_,
            CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END as nullable,
            pgd.description AS comment,
            t.table_type as source_type
        FROM
            information_schema.columns c
        JOIN
            information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        LEFT JOIN
            pg_catalog.pg_statio_all_tables as st on c.table_schema = st.schemaname and c.table_name = st.relname
        LEFT JOIN
            pg_catalog.pg_description pgd on pgd.objoid = st.relid and pgd.objsubid = c.ordinal_position
        WHERE
            (c.table_schema, c.table_name) IN ({})
            AND t.table_type IN ('BASE TABLE', 'VIEW')
        ORDER BY
            c.table_schema,
            c.table_name,
            c.ordinal_position;",
        table_pairs_str
    );

    // Query for materialized views
    let mv_sql = format!(
        "SELECT 
            c.relname as dataset_name,
            n.nspname as schema_name,
            a.attname as name,
            format_type(a.atttypid, a.atttypmod) as type_,
            NOT a.attnotnull as nullable,
            d.description as comment,
            'MATERIALIZED_VIEW' as source_type
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid
        LEFT JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = a.attnum
        WHERE c.relkind = 'm'
        AND (n.nspname, c.relname) IN ({})
        AND a.attnum > 0
        AND NOT a.attisdropped
        ORDER BY 
            n.nspname,
            c.relname,
            a.attnum;",
        table_pairs_str
    );

    let mut columns = Vec::new();

    // Get regular tables and views
    let regular_cols = match sqlx::query_as::<_, DatasetColumnRecord>(&regular_sql)
        .fetch_all(&postgres_conn)
        .await
    {
        Ok(c) => c,
        Err(e) => return Err(anyhow!("Error fetching regular columns: {:?}", e)),
    };

    // Get materialized view columns
    let mv_cols = match sqlx::query_as::<_, DatasetColumnRecord>(&mv_sql)
        .fetch_all(&postgres_conn)
        .await
    {
        Ok(c) => c,
        Err(e) => return Err(anyhow!("Error fetching materialized view columns: {:?}", e)),
    };

    // Combine results
    columns.extend(regular_cols);
    columns.extend(mv_cols);

    if let (Some(mut child_process), Some(tempfile)) = (child_process, tempfile) {
        child_process.kill()?;
        for file in tempfile {
            file.close()?;
        }
    }

    Ok(columns)
}

async fn get_redshift_columns_batch(
    datasets: &[(String, String)],
    credentials: &RedshiftCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    // Convert RedshiftCredentials to PostgresCredentials for the connection
    let pg_credentials = PostgresCredentials {
        host: credentials.host.clone(),
        port: credentials.port,
        username: credentials.username.clone(),
        password: credentials.password.clone(),
        database: credentials.database.clone(),
        schemas: None,
        jump_host: None,
        ssh_username: None,
        ssh_private_key: None,
    };

    let redshift_pool = match get_redshift_connection(&pg_credentials).await {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    // Build the IN clause for (schema, table) pairs
    let table_pairs: Vec<String> = datasets
        .iter()
        .map(|(table, schema)| format!("('{schema}', '{table}')"))
        .collect();
    let table_pairs_str = table_pairs.join(", ");

    // Query for tables and views in Redshift
    // Note: Redshift doesn't support pg_catalog.pg_statio_all_tables and pg_catalog.pg_description
    // the same way PostgreSQL does, so we simplify the query
    let sql = format!(
        "SELECT
            c.table_name as dataset_name,
            c.table_schema as schema_name,
            c.column_name as name,
            c.data_type as type_,
            CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END as nullable,
            NULL AS comment,
            t.table_type as source_type
        FROM
            information_schema.columns c
        JOIN
            information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE
            (c.table_schema, c.table_name) IN ({})
            AND t.table_type IN ('BASE TABLE', 'VIEW', 'MATERIALIZED VIEW')
        ORDER BY
            c.table_schema,
            c.table_name,
            c.ordinal_position;",
        table_pairs_str
    );

    let columns = sqlx::query_as::<_, DatasetColumnRecord>(&sql)
        .fetch_all(&redshift_pool)
        .await
        .map_err(|e| anyhow!("Error fetching columns from Redshift: {:?}", e))?;

    Ok(columns)
}

async fn get_mysql_columns_batch(
    datasets: &[(String, String)],
    credentials: &MySqlCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    let (mysql_conn, child_process, tempfile) = match get_mysql_connection(credentials).await {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    // Build the IN clause for table names
    let table_pairs: Vec<String> = datasets
        .iter()
        .map(|(table, schema)| format!("('{schema}', '{table}')"))
        .collect();
    let table_pairs_str = table_pairs.join(", ");

    let sql = format!(
        "SELECT
            c.TABLE_NAME as dataset_name,
            c.TABLE_SCHEMA as schema_name,
            CAST(c.COLUMN_NAME AS CHAR) as name,
            CAST(c.DATA_TYPE AS CHAR) as type_,
            CASE WHEN c.IS_NULLABLE = 'YES' THEN true ELSE false END as nullable,
            CAST(c.COLUMN_COMMENT AS CHAR) as comment,
            CAST(t.TABLE_TYPE AS CHAR) as source_type
        FROM
            INFORMATION_SCHEMA.COLUMNS c
        JOIN
            INFORMATION_SCHEMA.TABLES t ON c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
        WHERE
            (c.TABLE_SCHEMA, c.TABLE_NAME) IN ({})
        ORDER BY
            c.TABLE_SCHEMA,
            c.TABLE_NAME,
            c.ORDINAL_POSITION;",
        table_pairs_str
    );

    let columns = sqlx::query_as::<_, DatasetColumnRecord>(&sql)
        .fetch_all(&mysql_conn)
        .await
        .map_err(|e| anyhow!("Error fetching columns: {:?}", e))?;

    if let (Some(mut child_process), Some(tempfile)) = (child_process, tempfile) {
        child_process.kill()?;
        for file in tempfile {
            file.close()?;
        }
    }

    Ok(columns)
}

async fn get_bigquery_columns_batch(
    datasets: &[(String, String)],
    credentials: &BigqueryCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    let (bigquery_client, project_id) = get_bigquery_client(credentials).await?;

    // Build the IN clause for table names
    let table_pairs: Vec<String> = datasets
        .iter()
        .map(|(table, schema)| format!("('{schema}', '{table}')"))
        .collect();
    let table_pairs_str = table_pairs.join(", ");

    let sql = format!(
        r#"
        WITH all_columns AS (
            -- Regular tables and views
            SELECT
                t.table_name AS dataset_name,
                t.table_schema AS schema_name,
                column_name AS name,
                data_type AS type_,
                is_nullable = 'YES' AS nullable,
                NULL as comment,
                table_type as source_type
            FROM `region-us`.INFORMATION_SCHEMA.COLUMNS c
            JOIN `region-us`.INFORMATION_SCHEMA.TABLES t 
                USING(table_name, table_schema)
            WHERE (t.table_schema, t.table_name) IN ({})
            
            UNION ALL
            
            -- Materialized views specific metadata
            SELECT
                mv.table_name AS dataset_name,
                mv.table_schema AS schema_name,
                column_name AS name,
                data_type AS type_,
                is_nullable = 'YES' AS nullable,
                NULL as comment,
                'MATERIALIZED_VIEW' as source_type
            FROM `region-us`.INFORMATION_SCHEMA.MATERIALIZED_VIEWS mv
            JOIN `region-us`.INFORMATION_SCHEMA.COLUMNS c 
                USING(table_name, table_schema)
            WHERE (mv.table_schema, mv.table_name) IN ({})
        )
        SELECT * FROM all_columns
        ORDER BY
            schema_name,
            dataset_name,
            name
        "#,
        table_pairs_str, table_pairs_str
    );

    let query_request = QueryRequest {
        query: sql,
        max_results: Some(500),
        timeout_ms: Some(120000),
        use_legacy_sql: false,
        ..Default::default()
    };

    let result = bigquery_client
        .job()
        .query(&project_id, query_request)
        .await
        .map_err(|e| anyhow!("Error fetching columns: {:?}", e))?;

    let mut columns = Vec::new();

    if let Some(rows) = result.rows {
        for row in rows {
            if let Some(cols) = row.columns {
                let dataset_name = cols[0]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing dataset name"))?
                    .to_string();

                let schema_name = cols[1]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing schema name"))?
                    .to_string();

                let name = cols[2]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing column name"))?
                    .to_string();

                let type_ = cols[3]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing column type"))?
                    .to_string();

                let nullable = cols[4]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing nullable value"))?
                    .parse::<bool>()?;

                let comment = cols[5]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let source_type = cols[6]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Missing source type"))?
                    .to_string();

                columns.push(DatasetColumnRecord {
                    dataset_name: dataset_name.to_lowercase(), // Convert to lowercase for consistent comparison
                    schema_name: schema_name.to_lowercase(),   // Convert to lowercase for consistent comparison
                    name,                                      // Keep column name as is
                    type_,
                    nullable,
                    comment,
                    source_type,
                });
            }
        }
    }

    Ok(columns)
}

async fn get_snowflake_columns(
    dataset_name: &String,
    schema_name: &String,
    credentials: &SnowflakeCredentials,
) -> Result<Vec<DatasetColumnRecord>> {
    let snowflake_client = get_snowflake_client(credentials).await?;

    let uppercase_dataset_name = dataset_name.to_uppercase();
    let uppercase_schema_name = schema_name.to_uppercase();

    let sql = format!(
        "SELECT
            c.COLUMN_NAME AS name,
            c.DATA_TYPE AS type_,
            CASE WHEN c.IS_NULLABLE = 'YES' THEN true ELSE false END AS nullable,
            c.COMMENT AS comment,
            t.TABLE_TYPE as source_type
        FROM
            INFORMATION_SCHEMA.COLUMNS c
        JOIN 
            INFORMATION_SCHEMA.TABLES t 
            ON c.TABLE_NAME = t.TABLE_NAME 
            AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
        WHERE
            c.TABLE_NAME = '{uppercase_dataset_name}'
            AND c.TABLE_SCHEMA = '{uppercase_schema_name}'
        ORDER BY c.ORDINAL_POSITION;",
    );

    // Execute the query using the Snowflake client
    let results = snowflake_client
        .exec(&sql)
        .await
        .map_err(|e| anyhow!("Error executing query: {:?}", e))?;

    let mut columns = Vec::new();

    if let snowflake_api::QueryResult::Arrow(record_batches) = results {
        for batch in &record_batches {
            let schema = batch.schema();

            let name_index = schema
                .index_of("NAME")
                .map_err(|e| anyhow!("Error getting index for NAME: {:?}", e))?;
            let type_index = schema
                .index_of("TYPE_")
                .map_err(|e| anyhow!("Error getting index for TYPE_: {:?}", e))?;
            let nullable_index = schema
                .index_of("NULLABLE")
                .map_err(|e| anyhow!("Error getting index for NULLABLE: {:?}", e))?;
            let comment_index = schema
                .index_of("COMMENT")
                .map_err(|e| anyhow!("Error getting index for COMMENT: {:?}", e))?;
            let source_type_index = schema
                .index_of("SOURCE_TYPE")
                .map_err(|e| anyhow!("Error getting index for SOURCE_TYPE: {:?}", e))?;

            let name_column = batch.column(name_index);
            let type_column = batch.column(type_index);
            let nullable_column = batch.column(nullable_index);
            let comment_column = batch.column(comment_index);
            let source_type_column = batch.column(source_type_index);

            let name_array = name_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for NAME"))?;

            let type_array = type_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for TYPE_"))?;

            let nullable_array = nullable_column
                .as_any()
                .downcast_ref::<arrow::array::BooleanArray>()
                .ok_or_else(|| anyhow!("Expected BooleanArray for NULLABLE"))?;

            let comment_array = comment_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for COMMENT"))?;

            let source_type_array = source_type_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for SOURCE_TYPE"))?;

            for i in 0..batch.num_rows() {
                let name = name_array.value(i).to_string();
                let type_ = type_array.value(i).to_string();
                let nullable = nullable_array.value(i);
                let comment = if comment_array.is_null(i) {
                    None
                } else {
                    Some(comment_array.value(i).to_string())
                };
                let source_type = if source_type_array.is_null(i) {
                    "TABLE".to_string()
                } else {
                    source_type_array.value(i).to_string()
                };

                columns.push(DatasetColumnRecord {
                    dataset_name: dataset_name.clone().to_lowercase(), // Convert to lowercase for consistent comparison
                    schema_name: schema_name.clone().to_lowercase(),   // Convert to lowercase for consistent comparison
                    name,                                              // Keep column name as is
                    type_,
                    nullable,
                    comment,
                    source_type,
                });
            }
        }
    } else if let snowflake_api::QueryResult::Empty = results {
        return Ok(Vec::new());
    } else {
        return Err(anyhow!(
            "Unexpected query result format from Snowflake. Expected Arrow format."
        ));
    }

    Ok(columns)
}
