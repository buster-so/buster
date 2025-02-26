use anyhow::{anyhow, Result};
use arrow::array::Array;
use chrono::Utc;
use diesel::insert_into;
use diesel_async::RunQueryDsl;
use gcp_bigquery_client::model::query_request::QueryRequest;
use sqlx::FromRow;
use uuid::Uuid;

use crate::{
    database::{enums::DatasetType, lib::get_pg_pool, models::Dataset, schema::datasets},
    utils::{query_engine::credentials::Credential, user::user_info::get_user_organization_id},
};

use super::{
    credentials::{
        BigqueryCredentials, MySqlCredentials, PostgresCredentials, SnowflakeCredentials,
    },
    data_source_connections::{
        get_bigquery_client::get_bigquery_client, get_mysql_connection::get_mysql_connection,
        get_postgres_connection::get_postgres_connection,
        get_snowflake_client::get_snowflake_client,
    },
};

#[derive(Debug, Clone, FromRow)]
pub struct DatasetRecord {
    pub name: String,
    pub schema: String,
    pub definition: Option<String>,
    pub type_: String,
}

pub async fn import_datasets(
    credential: &Credential,
    data_source_id: &Uuid,
    created_by: &Uuid,
) -> Result<()> {
    let dataset_records = match retrieve_datasets(credential).await {
        Ok(records) => records,
        Err(e) => return Err(e),
    };

    match create_datasets(dataset_records, data_source_id, created_by).await {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error creating datasets: {:?}", e)),
    }
}

async fn create_datasets(
    dataset_records: Vec<DatasetRecord>,
    data_source_id: &Uuid,
    created_by: &Uuid,
) -> Result<()> {
    let organization_id = match get_user_organization_id(created_by).await {
        Ok(org_id) => org_id,
        Err(e) => return Err(anyhow!("Error getting user organization id: {}", e)),
    };

    let datasets = dataset_records
        .iter()
        .map(|record| Dataset {
            id: Uuid::new_v4(),
            name: record.name.clone(),
            database_name: record.name.clone(),
            when_to_use: None,
            when_not_to_use: None,
            type_: DatasetType::from_str(&record.type_).unwrap_or(DatasetType::Table),
            definition: record
                .definition
                .clone()
                .unwrap_or(String::from("TABLE IS DEFINED IN DATABASE/WAREHOUSE")),
            schema: record.schema.clone(),
            enabled: false,
            imported: true,
            data_source_id: *data_source_id,
            organization_id: organization_id,
            created_by: *created_by,
            updated_by: *created_by,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            deleted_at: None,
            yml_file: None,
            model: None,
            database_identifier: None,
        })
        .collect::<Vec<Dataset>>();

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection: {:?}", e)),
    };

    match insert_into(datasets::table)
        .values(datasets)
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error insserting datasets: {:?}", e)),
    }
}

async fn retrieve_datasets(credential: &Credential) -> Result<Vec<DatasetRecord>> {
    let dataset_records = match credential {
        Credential::Postgres(credential) => get_postgres_tables_and_views(credential).await?,
        Credential::MySQL(credential) => get_mysql_tables_and_views(credential).await?,
        Credential::Bigquery(credential) => get_bigquery_tables_and_views(credential).await?,
        Credential::Snowflake(credential) => get_snowflake_tables_and_views(credential).await?,
        _ => return Err(anyhow!("Unsupported database type")),
    };

    Ok(dataset_records)
}

async fn get_postgres_tables_and_views(
    credentials: &PostgresCredentials,
) -> Result<Vec<DatasetRecord>> {
    let (postgres_conn, child_process, tempfile) = match get_postgres_connection(credentials).await
    {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    let tables_and_views_query = format!(
        "
    SELECT
        c.relname AS name,
        n.nspname AS schema,
        CASE 
            WHEN c.relkind = 'r' THEN NULL
            WHEN c.relkind = 'v' THEN pg_get_viewdef(c.oid)
            WHEN c.relkind = 'm' THEN pg_get_viewdef(c.oid)
        END AS definition,
        CASE 
            WHEN c.relkind = 'r' THEN 'table'
            WHEN c.relkind = 'v' THEN 'view'
            WHEN c.relkind = 'm' THEN 'materializedView'
        END AS type_
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'v', 'm')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema') 
    ORDER BY schema, name;
    "
    );

    let table_and_views_records = match sqlx::query_as::<_, DatasetRecord>(&tables_and_views_query)
        .fetch_all(&postgres_conn)
        .await
    {
        Ok(records) => records,
        Err(e) => return Err(anyhow!("Error fetching table and views records: {:?}", e)),
    };

    if let (Some(mut child_process), Some(tempfile)) = (child_process, tempfile) {
        child_process.kill()?;
        for file in tempfile {
            file.close()?;
        }
    }

    Ok(table_and_views_records)
}

async fn get_mysql_tables_and_views(credentials: &MySqlCredentials) -> Result<Vec<DatasetRecord>> {
    let (mysql_conn, child_process, tempfile) = match get_mysql_connection(credentials).await {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    let schema_string = if let Some(schemas) = &credentials.databases {
        format!(
            "IN ({})",
            schemas
                .iter()
                .map(|s| format!("'{}'", s))
                .collect::<Vec<String>>()
                .join(", ")
        )
    } else {
        "NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')".to_string()
    };

    let tables_and_views_query = format!(
        "
    SELECT
        CAST(TABLE_NAME AS CHAR) AS name,
        CAST(TABLE_SCHEMA AS CHAR) AS `schema`,
        CAST(
            CASE 
                WHEN TABLE_TYPE = 'BASE TABLE' THEN NULL
                ELSE VIEW_DEFINITION
            END AS CHAR
        ) AS definition,
        CAST(
            CASE 
                WHEN TABLE_TYPE = 'BASE TABLE' THEN 'table'
                WHEN TABLE_TYPE = 'VIEW' THEN 'view'
            END AS CHAR
        ) AS type_
    FROM INFORMATION_SCHEMA.TABLES
    LEFT JOIN INFORMATION_SCHEMA.VIEWS USING (TABLE_SCHEMA, TABLE_NAME)
    WHERE TABLE_SCHEMA {}
    ORDER BY `schema`, name;
    ",
        schema_string
    );

    let table_and_views_records = match sqlx::query_as::<_, DatasetRecord>(&tables_and_views_query)
        .fetch_all(&mysql_conn)
        .await
    {
        Ok(records) => records,
        Err(e) => return Err(anyhow!("Error fetching table and views records: {:?}", e)),
    };

    if let (Some(mut child_process), Some(tempfile)) = (child_process, tempfile) {
        child_process.kill()?;
        for file in tempfile {
            file.close()?;
        }
    }

    Ok(table_and_views_records)
}

async fn get_bigquery_tables_and_views(
    credentials: &BigqueryCredentials,
) -> Result<Vec<DatasetRecord>> {
    let (bigquery_client, project_id) = match get_bigquery_client(credentials).await {
        Ok(conn) => conn,
        Err(e) => return Err(e),
    };

    let schema_string = "NOT IN ('INFORMATION_SCHEMA')".to_string();

    let tables_and_views_query = format!(
        "
    SELECT
        table_name AS name,
        table_schema AS `schema`,
        CASE 
            WHEN table_type = 'BASE TABLE' THEN NULL
            ELSE view_definition
        END AS definition,
        CASE 
            WHEN table_type = 'BASE TABLE' THEN 'table'
            WHEN table_type = 'VIEW' THEN 'view'
            WHEN table_type = 'MATERIALIZED VIEW' THEN 'materialized view'
        END AS type_
    FROM `{}.region-us.INFORMATION_SCHEMA.TABLES`
    LEFT JOIN `{}.region-us.INFORMATION_SCHEMA.VIEWS` USING (table_schema, table_name)
    WHERE table_schema {}
    ORDER BY `schema`, name;
    ",
        credentials.project_id, credentials.project_id, schema_string
    );

    let query_request = QueryRequest {
        location: None,
        max_results: None,
        maximum_bytes_billed: None,
        parameter_mode: None,
        preserve_nulls: None,
        query: tables_and_views_query,
        query_parameters: None,
        request_id: None,
        timeout_ms: None,
        use_legacy_sql: false,
        use_query_cache: None,
        format_options: None,
        connection_properties: None,
        default_dataset: None,
        dry_run: None,
        kind: None,
        labels: None,
    };

    let mut table_and_views_records = match bigquery_client
        .job()
        .query(&project_id, query_request)
        .await
    {
        Ok(res) => res,
        Err(e) => return Err(anyhow!("Error fetching table and views records: {:?}", e)),
    };

    let mut tables_and_views = Vec::new();

    if let Some(rows) = table_and_views_records.rows {
        for row in rows {
            if let Some(cols) = row.columns {
                let name = cols[0]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Error fetching table name"))?
                    .to_string();

                let schema = cols[1]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Error fetching table schema"))?
                    .to_string();

                let definition = cols[2]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .map(String::from);

                let type_ = cols[3]
                    .value
                    .as_ref()
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| anyhow!("Error fetching table type"))?
                    .to_string();

                tables_and_views.push(DatasetRecord {
                    name,
                    schema,
                    definition,
                    type_,
                });
            }
        }
    }

    Ok(tables_and_views)
}

async fn get_snowflake_tables_and_views(
    credentials: &SnowflakeCredentials,
) -> Result<Vec<DatasetRecord>> {
    let snowflake_client = get_snowflake_client(credentials).await?;

    let schema_list = credentials.schemas.clone().unwrap_or_else(|| vec![]);
    let schema_string = if !schema_list.is_empty() {
        format!(
            "IN ({})",
            schema_list
                .iter()
                .map(|s| format!("'{}'", s))
                .collect::<Vec<String>>()
                .join(", ")
        )
    } else {
        "NOT IN ('INFORMATION_SCHEMA', 'PUBLIC')".to_string()
    };

    let tables_and_views_query = format!(
        r#"
        SELECT 
            TABLE_SCHEMA AS "SCHEMA",
            TABLE_NAME AS "NAME",
            TABLE_TYPE AS "TYPE_",
            NULL AS "DEFINITION"
        FROM 
            INFORMATION_SCHEMA.TABLES
        WHERE 
            TABLE_SCHEMA {schema_string};
        "#,
        schema_string = schema_string
    );

    let query_result = match snowflake_client.exec(&tables_and_views_query).await {
        Ok(result) => result,
        Err(e) => return Err(anyhow!("Error executing query: {:?}", e)),
    };

    let mut tables_and_views = Vec::new();

    if let snowflake_api::QueryResult::Arrow(record_batches) = query_result {
        for batch in &record_batches {
            let schema = batch.schema();

            let name_index = match schema.index_of("NAME") {
                Ok(index) => index,
                Err(e) => return Err(anyhow!("Error getting index for NAME: {:?}", e)),
            };
            let schema_index = match schema.index_of("SCHEMA") {
                Ok(index) => index,
                Err(e) => return Err(anyhow!("Error getting index for SCHEMA: {:?}", e)),
            };
            let type_index = match schema.index_of("TYPE_") {
                Ok(index) => index,
                Err(e) => return Err(anyhow!("Error getting index for TYPE_: {:?}", e)),
            };
            let definition_index = match schema.index_of("DEFINITION") {
                Ok(index) => index,
                Err(e) => return Err(anyhow!("Error getting index for DEFINITION: {:?}", e)),
            };

            let name_column = batch.column(name_index);
            let schema_column = batch.column(schema_index);
            let type_column = batch.column(type_index);
            let definition_column = batch.column(definition_index);

            let name_array = name_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for NAME"))?;
            let schema_array = schema_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for SCHEMA"))?;
            let type_array = type_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for TYPE_"))?;
            let definition_array = definition_column
                .as_any()
                .downcast_ref::<arrow::array::StringArray>()
                .ok_or_else(|| anyhow!("Expected StringArray for DEFINITION"))?;

            for i in 0..batch.num_rows() {
                let name = name_array.value(i).to_string();
                let schema = schema_array.value(i).to_string();
                let type_ = type_array.value(i).to_string();
                let definition = if definition_array.is_null(i) {
                    None
                } else {
                    Some(definition_array.value(i).to_string())
                };

                tables_and_views.push(DatasetRecord {
                    name,
                    schema,
                    definition,
                    type_,
                });
            }
        }
    } else {
        // Log unexpected query result for debugging
        return Err(anyhow!("Unexpected query result format"));
    }

    Ok(tables_and_views)
}

// pub async fn get_databricks_tables_and_views(
//     credentials: &DatabricksCredentials,
// ) -> Result<Vec<DatasetRecord>> {
//     let databricks_client = get_databricks_client(credentials).await?;
//     let query = "SHOW TABLES ".to_string(); // Replace with the appropriate query if necessary
//     let results = databricks_query(databricks_client, query).await?;

//     let mut tables_and_views = Vec::new();

//     for row in results {
//         let name = row
//             .get("name")
//             .and_then(|v| v.as_text())
//             .ok_or_else(|| anyhow!("Missing 'name' field in databricks query result"))?
//             .to_string();

//         let schema = row
//             .get("schema")
//             .and_then(|v| v.as_text())
//             .ok_or_else(|| anyhow!("Missing 'schema' field in databricks query result"))?
//             .to_string();

//         let type_ = row
//             .get("type_")
//             .and_then(|v| v.as_text())
//             .ok_or_else(|| anyhow!("Missing 'type_' field in databricks query result"))?
//             .to_string();

//         let definition = row
//             .get("definition")
//             .and_then(|v| v.as_text())
//             .map(|s| s.to_string());

//         tables_and_views.push(DatasetRecord {
//             name,
//             schema,
//             type_,
//             definition,
//         });
//     }

//     Ok(tables_and_views)
// }
