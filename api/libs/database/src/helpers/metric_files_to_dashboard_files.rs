use anyhow::Result;
use chrono::Utc;
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::{AsyncConnection, RunQueryDsl};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

use crate::helpers::dashboard_files::create_new_dashboard_version;
use crate::models::{DashboardFile, MetricFileToDashboardFile};
use crate::pool::get_pg_pool;
use crate::schema::metric_files_to_dashboard_files;
use crate::schema::metric_files_to_dashboard_files::dsl::*;

#[derive(Debug)]
pub struct MetricVersionInput {
    pub metric_id: Uuid,
    pub new_metric_version: i32,
}

/// Handles the scenario where one or more metric files associated with dashboards are updated.
/// It finds the dashboards associated with the given metrics, creates new versions
/// of those dashboards, and then creates new association records linking the metrics
/// (with their new versions) to the newly created dashboard versions.
/// Transaction ensures atomicity.
///
/// # Arguments
/// * `metric_versions` - A vector of structs, each containing a metric ID and its new version number.
/// * `user_id` - The UUID of the user initiating the update.
///
/// # Returns
/// * `Result<()>` - Ok on success, or an error.
pub async fn upgrade_metric_and_dashboard_version(
    metric_versions_input: Vec<MetricVersionInput>,
    user_id: Uuid,
) -> Result<()> {
    if metric_versions_input.is_empty() {
        return Ok(());
    }

    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    let metric_ids_input: Vec<Uuid> = metric_versions_input
        .iter()
        .map(|mv| mv.metric_id)
        .collect();
    let new_metric_version_map: HashMap<Uuid, i32> = metric_versions_input
        .into_iter()
        .map(|mv| (mv.metric_id, mv.new_metric_version))
        .collect();

    conn.build_transaction()
        .run(|conn| {
            Box::pin(async move {
                // 1. Find the distinct, latest dashboard versions associated with the input metrics
                let latest_associations = metric_files_to_dashboard_files::table
                    .filter(metric_file_id.eq_any(&metric_ids_input))
                    .filter(deleted_at.is_null())
                    .distinct_on((
                        metric_file_id,
                        dashboard_file_id,
                        metric_version_number,
                        dashboard_version_number,
                    ))
                    .order_by((
                        metric_file_id,
                        dashboard_file_id,
                        metric_version_number,
                        dashboard_version_number,
                        created_at.desc(),
                    ))
                    .load::<MetricFileToDashboardFile>(conn)
                    .await?;

                // 2. Identify unique old dashboard IDs that need new versions
                let unique_old_dashboard_ids: HashSet<Uuid> = latest_associations
                    .iter()
                    .map(|assoc| assoc.dashboard_file_id)
                    .collect();

                // 3. Create new versions for these dashboards
                let mut old_to_new_dashboard_map: HashMap<Uuid, DashboardFile> = HashMap::new();
                for old_id in unique_old_dashboard_ids {
                    let new_dashboard_version =
                        create_new_dashboard_version(&old_id, &user_id).await?;
                    old_to_new_dashboard_map.insert(old_id, new_dashboard_version);
                }

                // 4. Prepare new association records
                let now = Utc::now();
                let mut new_associations_to_insert = Vec::new();

                for old_assoc in latest_associations {
                    if let (Some(new_metric_ver), Some(new_dashboard_ver_info)) = (
                        new_metric_version_map.get(&old_assoc.metric_file_id),
                        old_to_new_dashboard_map.get(&old_assoc.dashboard_file_id),
                    ) {
                        new_associations_to_insert.push(MetricFileToDashboardFile {
                            metric_file_id: old_assoc.metric_file_id,
                            dashboard_file_id: new_dashboard_ver_info.id,
                            metric_version_number: *new_metric_ver,
                            dashboard_version_number: new_dashboard_ver_info
                                .version_history
                                .get_version_number(),
                            created_at: now,
                            updated_at: now,
                            deleted_at: None,
                            created_by: user_id,
                        });
                    } else {
                        tracing::warn!(
                            metric_id = %old_assoc.metric_file_id,
                            dashboard_id = %old_assoc.dashboard_file_id,
                            "Could not find mapping for metric or dashboard version during upgrade."
                        );
                    }
                }

                // 5. Bulk insert the new associations
                if !new_associations_to_insert.is_empty() {
                    diesel::insert_into(metric_files_to_dashboard_files::table)
                        .values(new_associations_to_insert)
                        .execute(conn)
                        .await?;
                }

                Ok(())
            })
        })
        .await
}

/// Handles the scenario where a dashboard file itself is updated (creating a new version).
/// It finds all the latest distinct metric associations for the *old* dashboard version
/// and duplicates these associations, pointing them to the *new* dashboard version.
/// Transaction ensures atomicity.
///
/// # Arguments
/// * `old_dashboard_id` - The UUID of the previous version of the dashboard.
/// * `new_dashboard_id` - The UUID of the newly created version of the dashboard.
/// * `new_dashboard_version` - The version number of the new dashboard.
/// * `user_id` - The UUID of the user initiating the update.
///
/// # Returns
/// * `Result<()>` - Ok on success, or an error.
pub async fn update_dashboard_version(
    old_dashboard_id_param: Uuid,
    new_dashboard_id_param: Uuid,
    new_dashboard_version_param: i32,
    user_id: Uuid,
) -> Result<()> {
    let pool = get_pg_pool();
    let mut conn = pool.get().await?;

    conn.build_transaction()
        .run(|conn| {
            Box::pin(async move {
                // 1. Find the distinct, latest metric associations for the old dashboard version
                let latest_associations_for_old_dashboard = metric_files_to_dashboard_files::table
                    .filter(dashboard_file_id.eq(old_dashboard_id_param))
                    .filter(deleted_at.is_null())
                    .distinct_on((
                        metric_file_id,
                        dashboard_file_id,
                        metric_version_number,
                        dashboard_version_number,
                    ))
                    .order_by((
                        metric_file_id,
                        dashboard_file_id,
                        metric_version_number,
                        dashboard_version_number,
                        created_at.desc(),
                    ))
                    .select((metric_file_id, metric_version_number))
                    .load::<(Uuid, i32)>(conn)
                    .await?;

                // 2. Prepare new association records pointing to the new dashboard version
                let now = Utc::now();
                let new_associations_to_insert: Vec<_> = latest_associations_for_old_dashboard
                    .into_iter()
                    .map(
                        |(metric_id_val, metric_version_val)| MetricFileToDashboardFile {
                            metric_file_id: metric_id_val,
                            dashboard_file_id: new_dashboard_id_param,
                            metric_version_number: metric_version_val,
                            dashboard_version_number: new_dashboard_version_param,
                            created_at: now,
                            updated_at: now,
                            deleted_at: None,
                            created_by: user_id,
                        },
                    )
                    .collect();

                // 3. Bulk insert the new associations
                if !new_associations_to_insert.is_empty() {
                    diesel::insert_into(metric_files_to_dashboard_files::table)
                        .values(new_associations_to_insert)
                        .execute(conn)
                        .await?;
                }

                Ok(())
            })
        })
        .await
}
