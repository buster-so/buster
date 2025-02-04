use anyhow::{anyhow, Result};
use diesel::{
    insert_into, update, upsert::excluded, BoolExpressionMethods, ExpressionMethods, JoinOnDsl,
    NullableExpressionMethods, QueryDsl,
};
use diesel_async::RunQueryDsl;
use futures::future::join_all;
use serde_json::Value;
use std::{collections::HashMap, sync::Arc};

use crate::{
    database::{
        enums::UserOrganizationRole,
        lib::get_pg_pool,
        models::DatasetColumn,
        schema::{
            data_sources, dataset_columns, datasets, datasets_to_permission_groups,
            permission_groups_to_identities, teams_to_users, users, users_to_organizations,
        },
    },
    utils::clients::ai::{
        langfuse::PromptName,
        llm_router::{llm_chat, LlmMessage, LlmModel, LlmRole},
        openai::OpenAiChatModel,
    },
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::database::models::{DataSource, Dataset};

#[derive(Serialize, Clone, Debug)]
pub struct DatasetState {
    #[serde(flatten)]
    pub dataset: Dataset,
    pub created_by_name: String,
    pub data_source: DataSource,
    pub columns: Vec<DatasetColumn>,
}

pub async fn get_dataset_state(dataset_id: &Uuid, user_id: &Uuid) -> Result<DatasetState> {
    let dataset_id = Arc::new(dataset_id.clone());
    let user_id = Arc::new(user_id.clone());

    let dataset_and_cols_handle = {
        let dataset_id = dataset_id.clone();
        tokio::spawn(async move { get_dataset_and_columns(dataset_id).await })
    };

    let user_has_access_to_dataset_handle = {
        let user_id = user_id.clone();
        let dataset_id = dataset_id.clone();
        tokio::spawn(async move { user_has_access_to_dataset(user_id, dataset_id).await })
    };

    let (dataset_res, user_access_res) =
        match tokio::try_join!(dataset_and_cols_handle, user_has_access_to_dataset_handle) {
            Ok((dataset, user_access)) => (dataset, user_access),
            Err(e) => {
                tracing::error!("Error getting dataset and user access: {}", e);
                return Err(anyhow!("Error getting dataset and user access: {}", e));
            }
        };

    let (dataset, cols, data_source, created_by_name) = match dataset_res {
        Ok(dataset) => dataset,
        Err(e) => return Err(anyhow!("Error getting dataset: {}", e)),
    };

    let user_has_access = match user_access_res {
        Ok(user_access) => user_access,
        Err(e) => return Err(anyhow!("Error getting user access: {}", e)),
    };

    if !user_has_access {
        return Err(anyhow!("User does not have access to dataset"));
    }

    Ok(DatasetState {
        dataset,
        created_by_name,
        data_source,
        columns: cols,
    })
}

pub async fn get_dataset_state_from_col_id(col_id: &Uuid, user_id: &Uuid) -> Result<DatasetState> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting pg connection: {}", e)),
    };

    let dataset_id = match dataset_columns::table
        .select(dataset_columns::dataset_id)
        .filter(dataset_columns::id.eq(col_id))
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(dataset_id) => dataset_id,
        Err(e) => return Err(anyhow!("Error getting dataset id from column id: {}", e)),
    };

    let dataset_id = Arc::new(dataset_id.clone());
    let user_id = Arc::new(user_id.clone());

    let dataset_and_cols_handle = {
        let dataset_id = dataset_id.clone();
        tokio::spawn(async move { get_dataset_and_columns(dataset_id).await })
    };

    let user_has_access_to_dataset_handle = {
        let user_id = user_id.clone();
        let dataset_id = dataset_id.clone();
        tokio::spawn(async move { user_has_access_to_dataset(user_id, dataset_id).await })
    };

    let (dataset_res, user_access_res) =
        match tokio::try_join!(dataset_and_cols_handle, user_has_access_to_dataset_handle) {
            Ok((dataset, user_access)) => (dataset, user_access),
            Err(e) => {
                tracing::error!("Error getting dataset and user access: {}", e);
                return Err(anyhow!("Error getting dataset and user access: {}", e));
            }
        };

    let (dataset, cols, data_source, created_by_name) = match dataset_res {
        Ok(dataset) => dataset,
        Err(e) => return Err(anyhow!("Error getting dataset: {}", e)),
    };

    let user_has_access = match user_access_res {
        Ok(user_access) => user_access,
        Err(e) => return Err(anyhow!("Error getting user access: {}", e)),
    };

    if !user_has_access {
        return Err(anyhow!("User does not have access to dataset"));
    }

    Ok(DatasetState {
        dataset,
        created_by_name,
        data_source,
        columns: cols,
    })
}

async fn get_dataset_and_columns(
    dataset_id: Arc<Uuid>,
) -> Result<(Dataset, Vec<DatasetColumn>, DataSource, String)> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection: {:?}", e)),
    };

    let dataset_and_col_res: Vec<(
        Dataset,
        Option<DatasetColumn>,
        DataSource,
        Option<String>,
        String,
    )> = match datasets::table
        .left_join(
            dataset_columns::table.on(datasets::id
                .eq(dataset_columns::dataset_id)
                .and(dataset_columns::deleted_at.is_null())),
        )
        .inner_join(data_sources::table.on(datasets::data_source_id.eq(data_sources::id)))
        .inner_join(users::table.on(datasets::created_by.eq(users::id)))
        .filter(datasets::id.eq(dataset_id.as_ref()))
        .filter(datasets::deleted_at.is_null())
        .select((
            datasets::all_columns,
            (
                dataset_columns::id,
                dataset_columns::dataset_id,
                dataset_columns::name,
                dataset_columns::type_,
                dataset_columns::description.nullable(),
                dataset_columns::nullable,
                dataset_columns::created_at,
                dataset_columns::updated_at,
                dataset_columns::deleted_at.nullable(),
                dataset_columns::stored_values.nullable(),
                dataset_columns::stored_values_status.nullable(),
                dataset_columns::stored_values_error.nullable(),
                dataset_columns::stored_values_count.nullable(),
                dataset_columns::stored_values_last_synced.nullable(),
                dataset_columns::semantic_type.nullable(),
                dataset_columns::dim_type.nullable(),
                dataset_columns::expr.nullable(),
            )
                .nullable(),
            (
                data_sources::id,
                data_sources::name,
                data_sources::type_,
                data_sources::secret_id,
                data_sources::onboarding_status,
                data_sources::onboarding_error.nullable(),
                data_sources::organization_id,
                data_sources::created_by,
                data_sources::updated_by,
                data_sources::created_at,
                data_sources::updated_at,
                data_sources::deleted_at.nullable(),
                data_sources::env,
            ),
            users::name.nullable(),
            users::email,
        ))
        .load::<(
            Dataset,
            Option<DatasetColumn>,
            DataSource,
            Option<String>,
            String,
        )>(&mut conn)
        .await
    {
        Ok(dataset_and_col) => dataset_and_col,
        Err(e) => return Err(anyhow!("Error loading dataset: {:?}", e)),
    };

    let (dataset, columns, data_source, created_by_name) = dataset_and_col_res
        .into_iter()
        .fold(
            None,
            |acc: Option<(Dataset, Vec<DatasetColumn>, DataSource, String)>,
             (d, c, ds, name, email)| {
                Some(match acc {
                    None => (
                        d,
                        c.map_or(vec![], |col| vec![col]),
                        ds,
                        name.unwrap_or(email),
                    ),
                    Some((dataset, mut columns, ds, created_by)) => {
                        if let Some(col) = c {
                            columns.push(col);
                        }
                        (dataset, columns, ds, created_by)
                    }
                })
            },
        )
        .ok_or(anyhow!(
            "Dataset, DataSource and created_by_name should always be present"
        ))?;

    Ok((dataset, columns, data_source, created_by_name))
}

pub async fn user_has_access_to_dataset(user_id: Arc<Uuid>, dataset_id: Arc<Uuid>) -> Result<bool> {
    let is_organization_admin_handle = {
        let user_id = Arc::clone(&user_id);
        let dataset_id = Arc::clone(&dataset_id);
        tokio::spawn(async move { user_dataset_access(user_id, dataset_id).await })
    };

    let user_asset_role_handle = {
        let user_id = Arc::clone(&user_id);
        let dataset_id = Arc::clone(&dataset_id);
        tokio::spawn(async move { is_organization_admin_or_owner(user_id, dataset_id).await })
    };

    let (is_organization_admin, user_asset_role) =
        match tokio::try_join!(is_organization_admin_handle, user_asset_role_handle) {
            Ok((is_organization_admin, user_asset_role)) => {
                (is_organization_admin, user_asset_role)
            }
            Err(e) => {
                tracing::error!("Error getting user organization role: {}", e);
                return Err(anyhow!("Error getting user organization role: {}", e));
            }
        };

    let permissions = match user_asset_role {
        Ok(permissions) => permissions,
        Err(e) => {
            tracing::error!("Error getting user asset role: {}", e);
            return Err(anyhow!("Error getting user asset role: {}", e));
        }
    };

    let is_organization_admin = match is_organization_admin {
        Ok(is_admin) => is_admin,
        Err(e) => {
            tracing::error!("Error getting user organization role: {}", e);
            return Err(anyhow!("Error getting user organization role: {}", e));
        }
    };

    if is_organization_admin {
        return Ok(true);
    }

    if !permissions {
        return Ok(false);
    }

    Ok(true)
}

async fn user_dataset_access(user_id: Arc<Uuid>, dataset_id: Arc<Uuid>) -> Result<bool> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let permissions = match permission_groups_to_identities::table
        .left_join(
            teams_to_users::table
                .on(permission_groups_to_identities::identity_id.eq(teams_to_users::team_id)),
        )
        .left_join(
            datasets_to_permission_groups::table
                .on(permission_groups_to_identities::permission_group_id
                    .eq(datasets_to_permission_groups::permission_group_id)),
        )
        .select(permission_groups_to_identities::permission_group_id)
        .filter(
            permission_groups_to_identities::identity_id
                .eq(user_id.as_ref())
                .or(teams_to_users::user_id.eq(user_id.as_ref())),
        )
        .filter(datasets_to_permission_groups::dataset_id.eq(dataset_id.as_ref()))
        .filter(permission_groups_to_identities::deleted_at.is_null())
        .load::<Uuid>(&mut conn)
        .await
    {
        Ok(permissions) => permissions.len() > 0,
        Err(diesel::result::Error::NotFound) => return Ok(false),
        Err(e) => {
            tracing::error!("Error querying thread by ID: {}", e);
            return Err(anyhow!("Error querying thread by ID: {}", e));
        }
    };

    Ok(permissions)
}

pub async fn is_organization_admin_or_owner(
    user_id: Arc<Uuid>,
    dataset_id: Arc<Uuid>,
) -> Result<bool> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => {
            tracing::error!("Error getting pg connection: {}", e);
            return Err(anyhow!("Error getting pg connection: {}", e));
        }
    };

    let is_organization_admin = match users_to_organizations::table
        .inner_join(
            datasets::table.on(datasets::organization_id
                .eq(datasets::organization_id)
                .and(datasets::id.eq(dataset_id.as_ref()))
                .and(datasets::deleted_at.is_null())),
        )
        .select(users_to_organizations::role)
        .filter(users_to_organizations::user_id.eq(user_id.as_ref()))
        .filter(users_to_organizations::deleted_at.is_null())
        .first::<UserOrganizationRole>(&mut conn)
        .await
    {
        Ok(role) => role,
        Err(e) => {
            tracing::error!("Error getting user organization role: {}", e);
            return Err(anyhow!("Error getting user organization role: {}", e));
        }
    };

    let is_organization_adminig = if is_organization_admin == UserOrganizationRole::WorkspaceAdmin
        || is_organization_admin == UserOrganizationRole::DataAdmin
    {
        true
    } else {
        false
    };

    Ok(is_organization_adminig)
}

pub async fn generate_col_descriptions(
    dataset: Arc<DatasetState>,
    user_id: Arc<Uuid>,
) -> Result<()> {
    let dataset_name = Arc::new(dataset.dataset.name.clone());
    let dataset_id = Arc::new(dataset.dataset.id);
    let user_id = Arc::new(user_id);
    let columns = Arc::new(
        dataset
            .columns
            .iter()
            .filter(|col| col.description.is_none())
            .cloned()
            .collect::<Vec<DatasetColumn>>(),
    );

    let chunk_size = 10;
    let mut tasks = Vec::new();

    for chunk in columns.chunks(chunk_size) {
        let col_inputs: Vec<ColDescriptionInput> = chunk
            .iter()
            .map(|col| ColDescriptionInput {
                name: col.name.clone(),
                type_: col.type_.clone(),
            })
            .collect();

        let dataset_name = Arc::clone(&dataset_name);
        let dataset_id = Arc::clone(&dataset_id);
        let user_id = Arc::clone(&user_id);

        let task = tokio::spawn(async move {
            let col_descriptions = match generate_col_descriptions_ai_call(
                &dataset_name,
                &col_inputs,
                &dataset_id,
                user_id.as_ref(),
            )
            .await
            {
                Ok(col_descriptions) => col_descriptions,
                Err(e) => return Err(e),
            };

            Ok(col_descriptions)
        });

        tasks.push(task);
    }

    let results = join_all(tasks).await;
    let mut updated_columns_map: HashMap<Uuid, DatasetColumn> = HashMap::new();

    for result in results {
        match result {
            Ok(Ok(chunk)) => {
                for (col_name, col_description) in chunk.as_object().unwrap() {
                    let col = columns.iter().find(|c| &c.name == col_name).unwrap();
                    let mut updated_col = col.clone();
                    updated_col.description =
                        Some(col_description.as_str().unwrap_or_default().to_string());
                    updated_columns_map.insert(col.id, updated_col);
                }
            }
            Ok(Err(e)) => return Err(e),
            Err(e) => return Err(anyhow!("Task panicked: {}", e)),
        }
    }

    let updated_columns: Vec<DatasetColumn> = updated_columns_map.into_values().collect();

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting pg connection: {}", e)),
    };

    match insert_into(dataset_columns::table)
        .values(&updated_columns)
        .on_conflict(dataset_columns::id)
        .do_update()
        .set(dataset_columns::description.eq(excluded(dataset_columns::description)))
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            tracing::error!("Error updating dataset columns: {}", e);
            return Err(anyhow!("Error updating dataset columns: {}", e));
        }
    }
}

pub async fn generate_dataset_descriptions(
    dataset: Arc<DatasetState>,
    user_id: Arc<Uuid>,
) -> Result<()> {
    let dataset_definition = dataset.dataset.definition.clone();
    let dataset_id = dataset.dataset.id;
    let user_id = user_id.clone();

    let dataset_description =
        generate_dataset_description_ai_call(&dataset_definition, &dataset_id, &user_id).await?;

    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting pg connection: {}", e)),
    };

    match update(datasets::table)
        .set((
            datasets::when_to_use.eq(&dataset_description.when_to_use),
            datasets::when_not_to_use.eq(&dataset_description.when_not_to_use),
        ))
        .filter(datasets::id.eq(&dataset_id))
        .execute(&mut conn)
        .await
    {
        Ok(_) => (),
        Err(e) => return Err(anyhow!("Error updating dataset: {}", e)),
    };

    Ok(())
}

pub struct ColDescriptionInput {
    pub name: String,
    pub type_: String,
}

pub async fn generate_col_descriptions_ai_call(
    dataset_name: &String,
    cols: &Vec<ColDescriptionInput>,
    dataset_id: &Uuid,
    user_id: &Uuid,
) -> Result<Value> {
    let col_string = cols
        .iter()
        .map(|c| format!("- `{name}`: {type_}", name = c.name, type_ = c.type_,))
        .collect::<Vec<String>>()
        .join("\n");

    let user_message = format!("### TASK
Your task is to generate a short description about each of the columns from the `{dataset_name}` dataset. For context, each column has the name, type, and an example record.

You should try to describe what the column is, the structure/format of the data, or the unit being used when possible.

Do not reference specific values for the column bc it doesn't contain all of them.

We already know what the data type is, so no need to mention that.

Each description should only be 1 sentence max.


### COLUMNS
{col_string}


### OUTPUT
Output in json with each key being the column name and the value being the description.",
        col_string = col_string,
        dataset_name = dataset_name,
    );

    let col_descriptions = match llm_chat(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        &vec![LlmMessage {
            role: LlmRole::User,
            content: user_message.clone(),
        }],
        0.0,
        1000,
        20,
        None,
        true,
        None,
        dataset_id,
        user_id,
        PromptName::GenerateColDescriptions,
    )
    .await
    {
        Ok(response) => {
            let response_json: Value = match serde_json::from_str(&response) {
                Ok(select_term_response) => select_term_response,
                Err(e) => return Err(anyhow!(e)),
            };
            response_json
        }
        Err(e) => return Err(e),
    };

    Ok(col_descriptions)
}

#[derive(Deserialize)]
pub struct DatasetDescriptionOutput {
    pub when_to_use: String,
    pub when_not_to_use: String,
}

pub async fn generate_dataset_description_ai_call(
    dataset_definition: &String,
    dataset_id: &Uuid,
    user_id: &Uuid,
) -> Result<DatasetDescriptionOutput> {
    let user_message = format!("### TASK
Your task is to generate a description about when to use and when not to use the dataset mentioned below for data analysis.  Specifically, what types of questions, topics, etc. can be answered using the dataset.  Each description should be no longer than 4 sentences.

All data is accurate, up-to-date, and reliable.

### DEFINITION
{dataset_definition}

### OUTPUT
Output the description in JSON with 'when_to_use' and 'when_not_to_use' as the keys and the descriptions as the values.",
        dataset_definition = dataset_definition,
    );

    let select_term_response = match llm_chat(
        LlmModel::OpenAi(OpenAiChatModel::O3Mini),
        &vec![LlmMessage {
            role: LlmRole::User,
            content: user_message.clone(),
        }],
        0.0,
        1000,
        20,
        None,
        true,
        None,
        dataset_id,
        user_id,
        PromptName::GenerateDatasetDescription,
    )
    .await
    {
        Ok(response) => {
            let response_json: DatasetDescriptionOutput = match serde_json::from_str(&response) {
                Ok(select_term_response) => select_term_response,
                Err(e) => return Err(anyhow!(e)),
            };
            response_json
        }
        Err(e) => return Err(e),
    };

    Ok(select_term_response)
}
