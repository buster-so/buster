//! Library for handling dataset security and permissions.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use database::{
    enums::{IdentityType, UserOrganizationRole},
    pool::{get_pg_pool, PgPool},
    schema::{
        dataset_permissions,
        datasets,
        datasets_to_permission_groups,
        permission_groups,
        permission_groups_to_identities,
        teams,
        teams_to_users,
        users_to_organizations,
    },
};
use diesel::prelude::*;
use diesel::{
    BoolExpressionMethods,
    ExpressionMethods,
    JoinOnDsl,
    NullableExpressionMethods,
    Selectable,
    SelectableHelper,
};
use diesel_async::{
    pooled_connection::AsyncDieselConnectionManager,
    AsyncPgConnection,
    RunQueryDsl,
};
use std::collections::HashSet;
use tokio::{task::JoinHandle, try_join};
use uuid::Uuid;
use tracing::{debug, warn};

// Define the new struct mirroring the one in search_data_catalog.rs
#[derive(Queryable, Selectable, Clone, Debug)]
#[diesel(table_name = datasets)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct PermissionedDataset {
    pub id: Uuid,
    pub name: String,
    #[diesel(column_name = "yml_file")]
    pub yml_content: Option<String>, // Matches the local struct field name
    #[allow(dead_code)]
    pub created_at: DateTime<Utc>,
    #[allow(dead_code)]
    pub updated_at: DateTime<Utc>,
    #[allow(dead_code)]
    pub deleted_at: Option<DateTime<Utc>>,
    pub data_source_id: Uuid,
}

// --- Corrected Fetcher functions for different access paths ---

// Path 1: Direct User -> Dataset
async fn fetch_direct_user_dataset_ids(
    user_id: &Uuid
) -> Result<Vec<Uuid>> {
    let mut conn = get_pg_pool().get().await.context("DB Error")?; // Get connection inside function
    dataset_permissions::table
        .filter(dataset_permissions::permission_id.eq(user_id))
        .filter(dataset_permissions::permission_type.eq("user")) 
        .filter(dataset_permissions::deleted_at.is_null())
        .select(dataset_permissions::dataset_id)
        .load::<Uuid>(&mut conn)
        .await
        .context("Failed to fetch direct user dataset IDs")
}

// Path 3: User -> Team -> Dataset (Direct team assignment)
async fn fetch_team_direct_dataset_ids(
    user_id: &Uuid
) -> Result<Vec<Uuid>> {
    let mut conn = get_pg_pool().get().await.context("DB Error")?;
    dataset_permissions::table
        .inner_join(
            teams_to_users::table.on(dataset_permissions::permission_id
                .eq(teams_to_users::team_id)
                .and(dataset_permissions::permission_type.eq("team")) 
                .and(teams_to_users::user_id.eq(user_id))
                .and(teams_to_users::deleted_at.is_null())),
        )
        .filter(dataset_permissions::deleted_at.is_null())
        .select(dataset_permissions::dataset_id)
        .distinct()
        .load::<Uuid>(&mut conn)
        .await
        .context("Failed to fetch team direct dataset IDs")
}

// Path 2: User -> Group -> Dataset
async fn fetch_user_group_dataset_ids(
    user_id: &Uuid
) -> Result<Vec<Uuid>> {
    let mut conn = get_pg_pool().get().await.context("DB Error")?;
    datasets_to_permission_groups::table
        .inner_join(
            permission_groups::table.on(datasets_to_permission_groups::permission_group_id
                .eq(permission_groups::id)
                .and(permission_groups::deleted_at.is_null())),
        )
        .inner_join(
            permission_groups_to_identities::table.on(permission_groups::id
                .eq(permission_groups_to_identities::permission_group_id)
                .and(permission_groups_to_identities::identity_id.eq(user_id))
                .and(permission_groups_to_identities::identity_type.eq(IdentityType::User)) 
                .and(permission_groups_to_identities::deleted_at.is_null())),
        )
        .filter(datasets_to_permission_groups::deleted_at.is_null())
        .select(datasets_to_permission_groups::dataset_id)
        .distinct()
        .load::<Uuid>(&mut conn)
        .await
        .context("Failed to fetch user group dataset IDs")
}

// Path 4: User -> Team -> Group -> Dataset
async fn fetch_team_group_dataset_ids(
    user_id: &Uuid
) -> Result<Vec<Uuid>> {
    let mut conn = get_pg_pool().get().await.context("DB Error")?;
    datasets_to_permission_groups::table
        .inner_join(
            permission_groups::table.on(datasets_to_permission_groups::permission_group_id
                .eq(permission_groups::id)
                .and(permission_groups::deleted_at.is_null())),
        )
        .inner_join(
            permission_groups_to_identities::table.on(permission_groups::id
                .eq(permission_groups_to_identities::permission_group_id)
                .and(permission_groups_to_identities::identity_type.eq(IdentityType::Team)) 
                .and(permission_groups_to_identities::deleted_at.is_null())),
        )
        .inner_join(
            teams_to_users::table.on(permission_groups_to_identities::identity_id
                .eq(teams_to_users::team_id)
                .and(teams_to_users::user_id.eq(user_id))
                .and(teams_to_users::deleted_at.is_null())),
        )
        .filter(datasets_to_permission_groups::deleted_at.is_null())
        .select(datasets_to_permission_groups::dataset_id)
        .distinct()
        .load::<Uuid>(&mut conn)
        .await
        .context("Failed to fetch team group dataset IDs")
}

// --- Main Function ---

pub async fn get_permissioned_datasets(
    user_id: &Uuid,
    page: i64,
    page_size: i64,
) -> Result<Vec<PermissionedDataset>> {
    let mut conn = get_pg_pool().get().await.context("DB Error")?; // Get initial connection

    // Fetch user's organization and role
    let user_org_info = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select((
            users_to_organizations::organization_id,
            users_to_organizations::role,
        ))
        .first::<(Uuid, UserOrganizationRole)>(&mut conn)
        .await;

    match user_org_info {
        // --- Admin/Querier Path ---
        Ok((organization_id, role))
            if matches!(
                role,
                UserOrganizationRole::WorkspaceAdmin
                    | UserOrganizationRole::DataAdmin
                    | UserOrganizationRole::Querier
            ) =>
        {
            // Use the same connection for the admin query
            datasets::table
                .filter(datasets::organization_id.eq(organization_id))
                .filter(datasets::deleted_at.is_null())
                .select(PermissionedDataset::as_select())
                .order(datasets::name.asc()) 
                .limit(page_size)
                .offset(page * page_size)
                .load::<PermissionedDataset>(&mut conn)
                .await
                .context("Failed to load datasets for admin/querier")
        }

        // --- Non-Admin Path ---
        Ok(_) => {
            // Drop the initial connection before concurrent fetches
            drop(conn);
            // Fetch all potential dataset IDs concurrently
            let (
                direct_user_ids,
                team_direct_ids, 
                user_group_ids,  
                team_group_ids,  
            ) = try_join!(
                // Call helpers directly, they get their own connections
                fetch_direct_user_dataset_ids(user_id),
                fetch_team_direct_dataset_ids(user_id),
                fetch_user_group_dataset_ids(user_id),
                fetch_team_group_dataset_ids(user_id)
            )?;

            // Combine and deduplicate IDs
            let mut all_accessible_ids = HashSet::new();
            all_accessible_ids.extend(direct_user_ids);
            all_accessible_ids.extend(team_direct_ids);
            all_accessible_ids.extend(user_group_ids);
            all_accessible_ids.extend(team_group_ids);

            if all_accessible_ids.is_empty() {
                return Ok(Vec::new()); // No datasets accessible
            }

            // Fetch the actual dataset info for the combined IDs with pagination
            let mut conn = get_pg_pool().get().await.context("DB Error")?; // Get final connection
            datasets::table
                .filter(datasets::id.eq_any(all_accessible_ids))
                .filter(datasets::deleted_at.is_null()) 
                .select(PermissionedDataset::as_select())
                .order(datasets::name.asc()) 
                .limit(page_size)
                .offset(page * page_size)
                .load::<PermissionedDataset>(&mut conn)
                .await
                .context("Failed to load datasets for non-admin user")
        }

        // --- User Not In Organization ---
        Err(diesel::NotFound) => Ok(Vec::new()),

        // --- Other Error ---
        Err(e) => Err(e).context("Error fetching user organization role"),
    }
}

// Simplified check function
/*
async fn check_permission_exists<P>(predicate: P) -> Result<bool>
where
    P: diesel_async::methods::LoadQuery<'static, AsyncPgConnection, (i64,)>,
{
    let mut conn = get_conn().await?;
    let count = predicate
        .get_result::<i64>(&mut conn) // Use get_result for count
        .await?;
    Ok(count > 0)
}
*/

pub async fn has_dataset_access(user_id: &Uuid, dataset_id: &Uuid) -> Result<bool> {
    let mut conn = get_pg_pool().get().await.context("DB Error")?; // Get initial connection

    // --- Check if Dataset exists and get Organization ID and deleted status ---
    let dataset_info = datasets::table
        .filter(datasets::id.eq(dataset_id))
        // Remove the deleted_at filter here to check status later
        .select((datasets::organization_id, datasets::deleted_at))
        .first::<(Uuid, Option<DateTime<Utc>>)>(&mut conn)
        .await;

    let (organization_id, deleted_at_status) = match dataset_info {
        Ok((org_id, deleted_at)) => (org_id, deleted_at),
        Err(diesel::NotFound) => return Ok(false), // Dataset doesn't exist
        Err(e) => return Err(e).context("Failed to fetch dataset info"),
    };

    // --- Universal Check: If dataset is deleted, NO ONE has access ---
    if deleted_at_status.is_some() {
        return Ok(false);
    }

    // --- Dataset is NOT deleted, proceed with access checks ---

    // Check Admin/Querier Access
    let admin_access = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::organization_id.eq(organization_id))
        .filter(users_to_organizations::deleted_at.is_null())
        .select(users_to_organizations::role)
        .first::<UserOrganizationRole>(&mut conn)
        .await;

    if let Ok(role) = admin_access {
        if matches!(
            role,
            UserOrganizationRole::WorkspaceAdmin
                | UserOrganizationRole::DataAdmin
                | UserOrganizationRole::Querier
        ) {
            // Admins/Queriers have access to non-deleted datasets in their org
            return Ok(true);
        }
    } else if !matches!(admin_access, Err(diesel::NotFound)) {
        // Propagate unexpected errors from role check
        return Err(anyhow::Error::from(admin_access.err().unwrap()))
            .context("Error checking admin access");
    }

    // --- If not Admin/Querier, proceed with detailed permission checks ---
    // (No need to check deleted_at again here)

    // Drop initial connection before spawning tasks
    drop(conn);

    // Clone IDs needed for tasks
    let user_id = *user_id;
    let dataset_id = *dataset_id;

    // --- Check Non-Admin Access Paths Concurrently using Tokio tasks ---

    // Path 1: Direct User -> Dataset
    let task1: JoinHandle<Result<bool>> = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await.context("DB Error")?;
        let count = dataset_permissions::table
            .filter(dataset_permissions::permission_id.eq(user_id))
            .filter(dataset_permissions::permission_type.eq("user"))
            .filter(dataset_permissions::dataset_id.eq(dataset_id))
            .filter(dataset_permissions::deleted_at.is_null())
            .select(diesel::dsl::count_star())
            .get_result::<i64>(&mut conn)
            .await?;
        Ok(count > 0)
    });

    // Path 3: User -> Team -> Dataset
    let task2: JoinHandle<Result<bool>> = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await.context("DB Error")?;
        let count = dataset_permissions::table
            .inner_join(
                teams_to_users::table.on(dataset_permissions::permission_id
                    .eq(teams_to_users::team_id)
                    .and(dataset_permissions::permission_type.eq("team"))
                    .and(teams_to_users::user_id.eq(user_id))
                    .and(teams_to_users::deleted_at.is_null())),
            )
            .filter(dataset_permissions::dataset_id.eq(dataset_id))
            .filter(dataset_permissions::deleted_at.is_null())
            .select(diesel::dsl::count_star())
            .get_result::<i64>(&mut conn)
            .await?;
        Ok(count > 0)
    });

    // Path 2: User -> Group -> Dataset
    let task3: JoinHandle<Result<bool>> = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await.context("DB Error")?;
        let count = datasets_to_permission_groups::table
            .inner_join(
                permission_groups::table.on(datasets_to_permission_groups::permission_group_id
                    .eq(permission_groups::id)
                    .and(permission_groups::deleted_at.is_null())),
            )
            .inner_join(
                permission_groups_to_identities::table.on(permission_groups::id
                    .eq(permission_groups_to_identities::permission_group_id)
                    .and(permission_groups_to_identities::identity_id.eq(user_id))
                    .and(permission_groups_to_identities::identity_type.eq(IdentityType::User))
                    .and(permission_groups_to_identities::deleted_at.is_null())),
            )
            .filter(datasets_to_permission_groups::dataset_id.eq(dataset_id))
            .filter(datasets_to_permission_groups::deleted_at.is_null())
            .select(diesel::dsl::count_star())
            .get_result::<i64>(&mut conn)
            .await?;
        Ok(count > 0)
    });

    // Path 4: User -> Team -> Group -> Dataset
    let task4: JoinHandle<Result<bool>> = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await.context("DB Error")?;
        let count = datasets_to_permission_groups::table
            .inner_join(
                permission_groups::table.on(datasets_to_permission_groups::permission_group_id
                    .eq(permission_groups::id)
                    .and(permission_groups::deleted_at.is_null())),
            )
            .inner_join(
                permission_groups_to_identities::table.on(permission_groups::id
                    .eq(permission_groups_to_identities::permission_group_id)
                    .and(permission_groups_to_identities::identity_type.eq(IdentityType::Team))
                    .and(permission_groups_to_identities::deleted_at.is_null())),
            )
            .inner_join(
                teams_to_users::table.on(permission_groups_to_identities::identity_id
                    .eq(teams_to_users::team_id)
                    .and(teams_to_users::user_id.eq(user_id))
                    .and(teams_to_users::deleted_at.is_null())),
            )
            .filter(datasets_to_permission_groups::dataset_id.eq(dataset_id))
            .filter(datasets_to_permission_groups::deleted_at.is_null())
            .select(diesel::dsl::count_star())
            .get_result::<i64>(&mut conn)
            .await?;
        Ok(count > 0)
    });

    // Await tasks and check results
    let results = vec![task1, task2, task3, task4];
    for handle in results {
        match handle.await {
            Ok(Ok(true)) => return Ok(true), // Access granted by this path
            Ok(Ok(false)) => continue,       // This path didn't grant access, check next
            Ok(Err(e)) => return Err(e).context("Permission check task failed"), // DB error in check
            // Explicitly convert JoinError to anyhow::Error
            Err(e) => return Err(anyhow::Error::from(e)).context("Tokio task join error"),
        }
    }

    // If no task returned true
    Ok(false)
}

/// Checks if a user has access to ALL specified datasets.
/// Returns true if the user has access to every dataset in the list, false otherwise.
pub async fn has_all_datasets_access(user_id: &Uuid, dataset_ids: &[Uuid]) -> Result<bool> {
    if dataset_ids.is_empty() {
        // No datasets to check, vacuously true? Or should this be an error/false?
        // Let's assume true for now, meaning "no permissions required". Adjust if needed.
        // Changing to false for safer behavior: no datasets means no access granted.
        return Ok(false);
    }

    let mut conn = get_pg_pool().get().await.context("DB Error")?; // Get initial connection

    // --- Step 1: Verify all datasets exist, are not deleted, and get their org IDs ---
    let dataset_infos = datasets::table
        .filter(datasets::id.eq_any(dataset_ids))
        .select((datasets::id, datasets::organization_id, datasets::deleted_at))
        .load::<(Uuid, Uuid, Option<DateTime<Utc>>)>(&mut conn)
        .await
        .context("Failed to fetch dataset info for bulk check")?;

    // Check if we found info for all requested datasets
    if dataset_infos.len() != dataset_ids.len() {
        warn!("One or more dataset IDs not found during bulk access check.");
        return Ok(false); // At least one dataset doesn't exist
    }

    // Check for deleted datasets and collect unique organization IDs
    let mut organization_ids = std::collections::HashSet::new();
    for (id, org_id, deleted_at) in &dataset_infos {
        if deleted_at.is_some() {
            warn!("Dataset {} is deleted, access denied in bulk check.", id);
            return Ok(false); // Access denied if any dataset is deleted
        }
        organization_ids.insert(*org_id);
    }

    // --- Step 2: Check Admin/Querier access across all relevant organizations ---
    // If the user is an Admin/Querier in ANY of the organizations containing these datasets,
    // they have access to ALL non-deleted datasets within those specific orgs.
    // We need to ensure ALL datasets belong to orgs where the user has such a role.

    let admin_roles = users_to_organizations::table
        .filter(users_to_organizations::user_id.eq(user_id))
        .filter(users_to_organizations::organization_id.eq_any(organization_ids.iter().cloned().collect::<Vec<_>>()))
        .filter(users_to_organizations::deleted_at.is_null())
        .select((users_to_organizations::organization_id, users_to_organizations::role))
        .load::<(Uuid, UserOrganizationRole)>(&mut conn)
        .await
        .context("Error checking admin roles for bulk dataset access")?;

    let admin_org_ids_with_access: std::collections::HashSet<Uuid> = admin_roles
        .into_iter()
        .filter_map(|(org_id, role)| {
            if matches!(
                role,
                UserOrganizationRole::WorkspaceAdmin
                    | UserOrganizationRole::DataAdmin
                    | UserOrganizationRole::Querier
            ) {
                Some(org_id)
            } else {
                None
            }
        })
        .collect();

    // Check if all required organization IDs are covered by the user's admin/querier roles
    if organization_ids.is_subset(&admin_org_ids_with_access) {
         debug!("User {} has admin/querier access to all required organizations for datasets {:?}", user_id, dataset_ids);
        return Ok(true); // User is admin/querier in all necessary orgs
    }


    // --- Step 3: If not fully covered by admin/querier roles, check specific permissions for each dataset ---
    // This requires checking each dataset individually using the existing logic.
    // We can iterate and call the single `has_dataset_access` function.
    // This might be less efficient than a complex bulk query but reuses existing logic.

    // Drop the connection before potentially spawning tasks in the loop
    drop(conn);

    for dataset_id in dataset_ids {
        // We could call the existing has_dataset_access here.
        // However, it repeats the deleted check and org role check we partially did.
        // Let's refine the logic to avoid redundant checks.

         let dataset_org_id = dataset_infos.iter().find(|(id, _, _)| id == dataset_id).map(|(_, org_id, _)| *org_id)
             .expect("Dataset info missing after validation - this is a bug"); // Should exist due to earlier checks
         if admin_org_ids_with_access.contains(&dataset_org_id) {
             // User has admin/querier access in this dataset's org, so access is granted for this specific dataset.
             continue; // Move to the next dataset
         }


        // If not admin/querier for this dataset's org, perform detailed permission checks
        // Using a simplified version of the concurrent checks from has_dataset_access
        let has_specific_access = check_specific_dataset_permissions(user_id, dataset_id).await?;
        if !has_specific_access {
             debug!("User {} lacks specific permissions for dataset {} in bulk check.", user_id, dataset_id);
            return Ok(false); // If access fails for any single dataset, the whole check fails
        }
    }

    // If the loop completes without returning false, the user has access to all datasets
    debug!("User {} has access to all datasets {:?} via specific permissions or admin roles.", user_id, dataset_ids);
    Ok(true)
}

/// Helper function for `has_all_datasets_access` to check non-admin permissions for a single dataset.
/// This avoids repeating the deleted check and admin check.
async fn check_specific_dataset_permissions(user_id: &Uuid, dataset_id: &Uuid) -> Result<bool> {

     // Clone IDs needed for tasks
    let user_id = *user_id;
    let dataset_id = *dataset_id;

    // --- Check Non-Admin Access Paths Concurrently using Tokio tasks ---
    // Path 1: Direct User -> Dataset
    let task1: JoinHandle<Result<bool>> = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await.context("DB Error")?;
        let count = dataset_permissions::table
            .filter(dataset_permissions::permission_id.eq(user_id))
            .filter(dataset_permissions::permission_type.eq("user"))
            .filter(dataset_permissions::dataset_id.eq(dataset_id))
            .filter(dataset_permissions::deleted_at.is_null())
            .select(diesel::dsl::count_star())
            .get_result::<i64>(&mut conn)
            .await?;
        Ok(count > 0)
    });

    // Path 3: User -> Team -> Dataset
    let task2: JoinHandle<Result<bool>> = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await.context("DB Error")?;
        let count = dataset_permissions::table
            .inner_join(
                teams_to_users::table.on(dataset_permissions::permission_id
                    .eq(teams_to_users::team_id)
                    .and(dataset_permissions::permission_type.eq("team"))
                    .and(teams_to_users::user_id.eq(user_id))
                    .and(teams_to_users::deleted_at.is_null())),
            )
            .filter(dataset_permissions::dataset_id.eq(dataset_id))
            .filter(dataset_permissions::deleted_at.is_null())
            .select(diesel::dsl::count_star())
            .get_result::<i64>(&mut conn)
            .await?;
        Ok(count > 0)
    });

    // Path 2: User -> Group -> Dataset
    let task3: JoinHandle<Result<bool>> = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await.context("DB Error")?;
        let count = datasets_to_permission_groups::table
            .inner_join(
                permission_groups::table.on(datasets_to_permission_groups::permission_group_id
                    .eq(permission_groups::id)
                    .and(permission_groups::deleted_at.is_null())),
            )
            .inner_join(
                permission_groups_to_identities::table.on(permission_groups::id
                    .eq(permission_groups_to_identities::permission_group_id)
                    .and(permission_groups_to_identities::identity_id.eq(user_id))
                    .and(permission_groups_to_identities::identity_type.eq(IdentityType::User))
                    .and(permission_groups_to_identities::deleted_at.is_null())),
            )
            .filter(datasets_to_permission_groups::dataset_id.eq(dataset_id))
            .filter(datasets_to_permission_groups::deleted_at.is_null())
            .select(diesel::dsl::count_star())
            .get_result::<i64>(&mut conn)
            .await?;
        Ok(count > 0)
    });

    // Path 4: User -> Team -> Group -> Dataset
    let task4: JoinHandle<Result<bool>> = tokio::spawn(async move {
        let mut conn = get_pg_pool().get().await.context("DB Error")?;
        let count = datasets_to_permission_groups::table
            .inner_join(
                permission_groups::table.on(datasets_to_permission_groups::permission_group_id
                    .eq(permission_groups::id)
                    .and(permission_groups::deleted_at.is_null())),
            )
            .inner_join(
                permission_groups_to_identities::table.on(permission_groups::id
                    .eq(permission_groups_to_identities::permission_group_id)
                    .and(permission_groups_to_identities::identity_type.eq(IdentityType::Team))
                    .and(permission_groups_to_identities::deleted_at.is_null())),
            )
            .inner_join(
                teams_to_users::table.on(permission_groups_to_identities::identity_id
                    .eq(teams_to_users::team_id)
                    .and(teams_to_users::user_id.eq(user_id))
                    .and(teams_to_users::deleted_at.is_null())),
            )
            .filter(datasets_to_permission_groups::dataset_id.eq(dataset_id))
            .filter(datasets_to_permission_groups::deleted_at.is_null())
            .select(diesel::dsl::count_star())
            .get_result::<i64>(&mut conn)
            .await?;
        Ok(count > 0)
    });

     // Await tasks and check results
    let results = vec![task1, task2, task3, task4];
    for handle in results {
        match handle.await {
            Ok(Ok(true)) => return Ok(true), // Access granted by this path
            Ok(Ok(false)) => continue,       // This path didn't grant access, check next
            Ok(Err(e)) => return Err(e).context("Permission check task failed"), // DB error in check
            Err(e) => return Err(anyhow::Error::from(e)).context("Tokio task join error"), // Task failed
        }
    }

    // If no task returned true
    Ok(false)

}
