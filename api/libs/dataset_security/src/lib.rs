//! Library for handling dataset security and permissions.

use anyhow::{anyhow, Result};
use diesel::{BoolExpressionMethods, ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use uuid::Uuid;

use database::{
    pool::{get_pg_pool, PgPool},
    models::Dataset,
    schema::{
        datasets,
        datasets_to_permission_groups,
        permission_groups,
        permission_groups_to_identities,
        teams_to_users,
    },
};

pub async fn get_permissioned_datasets(
    pool: &PgPool,
    user_id: &Uuid,
    page: i64,
    page_size: i64,
) -> Result<Vec<Dataset>> {
    let mut conn = match pool.get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    // TODO: Add logic to check if user is admin, if so, return all datasets

    let datasets = match datasets::table
        .select(datasets::all_columns)
        .inner_join(
            datasets_to_permission_groups::table
                .on(datasets::id.eq(datasets_to_permission_groups::dataset_id)),
        )
        .inner_join(
            permission_groups::table
                .on(datasets_to_permission_groups::permission_group_id.eq(permission_groups::id)),
        )
        .inner_join(
            permission_groups_to_identities::table
                .on(permission_groups::id.eq(permission_groups_to_identities::permission_group_id)),
        )
        .inner_join(
            teams_to_users::table
                .on(teams_to_users::team_id.eq(permission_groups_to_identities::identity_id)),
        )
        .filter(
            teams_to_users::user_id
                .eq(&user_id)
                .or(permission_groups_to_identities::identity_id.eq(&user_id)),
        )
        .filter(datasets::deleted_at.is_null())
        .limit(page_size)
        .offset(page * page_size)
        .load::<Dataset>(&mut conn)
        .await
    {
        Ok(datasets) => datasets,
        Err(e) => return Err(anyhow!("Unable to get team datasets from database: {}", e)),
    };

    Ok(datasets)
}

pub async fn has_dataset_access(user_id: &Uuid, dataset_id: &Uuid) -> Result<bool> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Unable to get connection from pool: {}", e)),
    };

    let has_dataset_access = match datasets::table
        .select(datasets::id)
        .inner_join(
            datasets_to_permission_groups::table
                .on(datasets::id.eq(datasets_to_permission_groups::dataset_id)),
        )
        .inner_join(
            permission_groups::table
                .on(datasets_to_permission_groups::permission_group_id.eq(permission_groups::id)),
        )
        .inner_join(
            permission_groups_to_identities::table
                .on(permission_groups::id.eq(permission_groups_to_identities::permission_group_id)),
        )
        .inner_join(
            teams_to_users::table
                .on(teams_to_users::team_id.eq(permission_groups_to_identities::identity_id)),
        )
        .filter(
            teams_to_users::user_id
                .eq(&user_id)
                .or(permission_groups_to_identities::identity_id.eq(&user_id)),
        )
        .filter(datasets::id.eq(&dataset_id))
        .filter(datasets::deleted_at.is_null())
        .filter(
            datasets_to_permission_groups::deleted_at
                .is_null()
                .and(permission_groups::deleted_at.is_null())
                .and(permission_groups_to_identities::deleted_at.is_null())
                .and(teams_to_users::deleted_at.is_null()),
        )
        .first::<Uuid>(&mut conn)
        .await
    {
        Ok(_) => true,
        Err(diesel::NotFound) => false,
        Err(e) => return Err(anyhow!("Unable to get team datasets from database: {}", e)),
    };

    Ok(has_dataset_access)
} 