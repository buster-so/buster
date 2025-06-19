use anyhow::Result;
use diesel::prelude::*;
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use crate::pool::get_pg_pool;

pub async fn get_dataset_names_for_organization(org_id: Uuid) -> Result<Vec<String>, anyhow::Error> {
    use crate::schema::datasets::dsl::*;

    let mut conn = get_pg_pool().get().await?;

    let results = datasets
        .filter(organization_id.eq(org_id))
        .filter(deleted_at.is_null())
        .filter(yml_file.is_not_null())
        .select(name)
        .load::<String>(&mut conn)
        .await?;

    Ok(results)
}
