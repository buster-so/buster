use std::sync::Arc;

use anyhow::{anyhow, Result};
use diesel::{insert_into, upsert::excluded, ExpressionMethods, JoinOnDsl, QueryDsl};
use diesel_async::RunQueryDsl;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use database::{
    enums::AssetType,
    pool::get_pg_pool,
    models::UserFavorite,
    schema::{collections, collections_to_assets, dashboard_files, chats, messages_deprecated, threads_deprecated, user_favorites, metric_files, report_files},
};

use middleware::AuthenticatedUser;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub struct FavoriteIdAndType {
    pub id: Uuid,
    #[serde(rename = "asset_type")]
    pub type_: AssetType,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserFavoritesReq {
    pub favorites: Vec<FavoriteIdAndType>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FavoriteObject {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "asset_type")]
    pub type_: AssetType,
}

pub async fn list_user_favorites(user: &AuthenticatedUser) -> Result<Vec<FavoriteObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let user_favorites = match user_favorites::table
        .select((user_favorites::asset_id, user_favorites::asset_type))
        .filter(user_favorites::user_id.eq(user.id))
        .filter(user_favorites::deleted_at.is_null())
        .order(user_favorites::order_index.asc())
        .load::<(Uuid, AssetType)>(&mut conn)
        .await
    {
        Ok(favorites) => favorites,
        Err(e) => return Err(anyhow!("Error loading user favorites: {:?}", e)),
    };

    let dashboard_favorites = {
        let dashboard_ids = Arc::new(
            user_favorites
                .iter()
                .filter(|(_, f)| f == &AssetType::DashboardFile)
                .map(|f| f.0)
                .collect::<Vec<Uuid>>(),
        );
        tokio::spawn(async move { get_favorite_dashboards(dashboard_ids).await })
    };

    let collection_favorites = {
        let collection_ids = Arc::new(
            user_favorites
                .iter()
                .filter(|(_, f)| f == &AssetType::Collection)
                .map(|f| f.0)
                .collect::<Vec<Uuid>>(),
        );
        tokio::spawn(async move { get_assets_from_collections(collection_ids).await })
    };

    let threads_favorites = {
        let thread_ids = Arc::new(
            user_favorites
                .iter()
                .filter(|(_, f)| f == &AssetType::Thread)
                .map(|f| f.0)
                .collect::<Vec<Uuid>>(),
        );
        tokio::spawn(async move { get_favorite_threads(thread_ids).await })
    };

    let metrics_favorites = {
        let metric_ids = Arc::new(
            user_favorites
                .iter()
                .filter(|(_, f)| f == &AssetType::MetricFile)
                .map(|f| f.0)
                .collect::<Vec<Uuid>>(),
        );
        tokio::spawn(async move { get_favorite_metrics(metric_ids).await })
    };

    let chats_favorites = {
        let chat_ids = Arc::new(
            user_favorites
                .iter()
                .filter(|(_, f)| f == &AssetType::Chat)
                .map(|f| f.0)
                .collect::<Vec<Uuid>>(),
        );
        tokio::spawn(async move { get_favorite_chats(chat_ids).await })
    };

    let reports_favorites = {
        let report_ids = Arc::new(
            user_favorites
                .iter()
                .filter(|(_, f)| f == &AssetType::ReportFile)
                .map(|f| f.0)
                .collect::<Vec<Uuid>>(),
        );
        tokio::spawn(async move { get_favorite_reports(report_ids).await })
    };

    let (dashboard_fav_res, collection_fav_res, threads_fav_res, metrics_fav_res, chats_fav_res, reports_fav_res) =
        match tokio::try_join!(dashboard_favorites, collection_favorites, threads_favorites, metrics_favorites, chats_favorites, reports_favorites) {
            Ok((dashboard_fav_res, collection_fav_res, threads_fav_res, metrics_fav_res, chats_fav_res, reports_fav_res)) => {
                (dashboard_fav_res, collection_fav_res, threads_fav_res, metrics_fav_res, chats_fav_res, reports_fav_res)
            }
            Err(e) => {
                tracing::error!("Error getting favorite assets: {}", e);
                return Err(anyhow!("Error getting favorite assets: {}", e));
            }
        };

    let favorite_dashboards = match dashboard_fav_res {
        Ok(dashboards) => dashboards,
        Err(e) => {
            tracing::error!("Error getting favorite dashboards: {}", e);
            return Err(anyhow!("Error getting favorite dashboards: {}", e));
        }
    };

    let favorite_collections = match collection_fav_res {
        Ok(collections) => collections,
        Err(e) => {
            tracing::error!("Error getting favorite collections: {}", e);
            return Err(anyhow!("Error getting favorite collections: {}", e));
        }
    };

    let favorite_threads = match threads_fav_res {
        Ok(threads) => threads,
        Err(e) => {
            tracing::error!("Error getting favorite threads: {}", e);
            return Err(anyhow!("Error getting favorite threads: {}", e));
        }
    };

    let favorite_metrics = match metrics_fav_res {
        Ok(metrics) => metrics,
        Err(e) => {
            tracing::error!("Error getting favorite metrics: {}", e);
            return Err(anyhow!("Error getting favorite metrics: {}", e));
        }
    };

    let favorite_chats = match chats_fav_res {
        Ok(chats) => chats,
        Err(e) => {
            tracing::error!("Error getting favorite chats: {}", e);
            return Err(anyhow!("Error getting favorite chats: {}", e));
        }
    };

    let favorite_reports = match reports_fav_res {
        Ok(reports) => reports,
        Err(e) => {
            tracing::error!("Error getting favorite reports: {}", e);
            return Err(anyhow!("Error getting favorite reports: {}", e));
        }
    };

    let mut favorites: Vec<FavoriteObject> = Vec::with_capacity(user_favorites.len());

    for favorite in &user_favorites {
        match favorite.1 {
            AssetType::DashboardFile => {
                if let Some(dashboard) = favorite_dashboards.iter().find(|d| d.id == favorite.0) {
                    favorites.push(FavoriteObject {
                        id: dashboard.id,
                        name: dashboard.name.clone(),
                        type_: AssetType::DashboardFile,
                    });
                }
            }
            AssetType::Collection => {
                if let Some(collection) = favorite_collections
                    .iter()
                    .find(|c| c.id == favorite.0)
                {
                    favorites.push(FavoriteObject {
                        id: collection.id,
                        name: collection.name.clone(),
                        type_: AssetType::Collection,
                    });
                }
            }
            AssetType::Thread => {
                if let Some(thread) = favorite_threads.iter().find(|t| t.id == favorite.0) {
                    favorites.push(FavoriteObject {
                        id: thread.id,
                        name: thread.name.clone(),
                        type_: AssetType::Thread,
                    });
                }
            }
            AssetType::MetricFile => {
                if let Some(metric) = favorite_metrics.iter().find(|m| m.id == favorite.0) {
                    favorites.push(FavoriteObject {
                        id: metric.id,
                        name: metric.name.clone(),
                        type_: AssetType::MetricFile,
                    });
                }
            }
            AssetType::Chat => {
                if let Some(chat) = favorite_chats.iter().find(|c| c.id == favorite.0) {
                    favorites.push(FavoriteObject {
                        id: chat.id,
                        name: chat.name.clone(),
                        type_: AssetType::Chat,
                    });
                }
            }
            AssetType::ReportFile => {
                if let Some(report) = favorite_reports.iter().find(|r| r.id == favorite.0) {
                    favorites.push(FavoriteObject {
                        id: report.id,
                        name: report.name.clone(),
                        type_: AssetType::ReportFile,
                    });
                }
            }
            _ => {}
        }
    }

    Ok(favorites)
}

async fn get_favorite_threads(thread_ids: Arc<Vec<Uuid>>) -> Result<Vec<FavoriteObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let thread_records: Vec<(Uuid, Option<String>)> = match threads_deprecated::table
        .inner_join(messages_deprecated::table.on(threads_deprecated::id.eq(messages_deprecated::thread_id)))
        .select((threads_deprecated::id, messages_deprecated::title))
        .filter(threads_deprecated::id.eq_any(thread_ids.as_ref()))
        .filter(threads_deprecated::deleted_at.is_null())
        .filter(messages_deprecated::deleted_at.is_null())
        .filter(messages_deprecated::draft_session_id.is_null())
        .distinct_on(threads_deprecated::id)
        .order((threads_deprecated::id, messages_deprecated::created_at.desc()))
        .load::<(Uuid, Option<String>)>(&mut conn)
        .await
    {
        Ok(thread_records) => thread_records,
        Err(diesel::NotFound) => return Err(anyhow!("Threads not found")),
        Err(e) => return Err(anyhow!("Error loading thread records: {:?}", e)),
    };

    let favorite_threads = thread_records
        .iter()
        .map(|(id, name)| FavoriteObject {
            id: *id,
            name: name.clone().unwrap_or_else(|| String::from("Untitled")),
            type_: AssetType::Thread,
        })
        .collect();

    Ok(favorite_threads)
}

async fn get_favorite_dashboards(dashboard_ids: Arc<Vec<Uuid>>) -> Result<Vec<FavoriteObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let dashboard_records: Vec<(Uuid, String)> = match dashboard_files::table
        .select((dashboard_files::id, dashboard_files::name))
        .filter(dashboard_files::id.eq_any(dashboard_ids.as_ref()))
        .filter(dashboard_files::deleted_at.is_null())
        .load::<(Uuid, String)>(&mut conn)
        .await
    {
        Ok(dashboard_records) => dashboard_records,
        Err(diesel::NotFound) => return Err(anyhow!("Dashboard files not found")),
        Err(e) => return Err(anyhow!("Error loading dashboard file records: {:?}", e)),
    };

    let favorite_dashboards = dashboard_records
        .iter()
        .map(|(id, name)| FavoriteObject {
            id: *id,
            name: name.clone(),
            type_: AssetType::DashboardFile,
        })
        .collect();
    Ok(favorite_dashboards)
}

async fn get_favorite_chats(chat_ids: Arc<Vec<Uuid>>) -> Result<Vec<FavoriteObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let chat_records: Vec<(Uuid, String)> = match chats::table
        .select((chats::id, chats::title))
        .filter(chats::id.eq_any(chat_ids.as_ref()))
        .filter(chats::deleted_at.is_null())
        .load::<(Uuid, String)>(&mut conn)
        .await
    {
        Ok(chat_records) => chat_records,
        Err(diesel::NotFound) => return Err(anyhow!("Chats not found")),
        Err(e) => return Err(anyhow!("Error loading chat records: {:?}", e)),
    };

    let favorite_chats = chat_records
        .iter()
        .map(|(id, title)| FavoriteObject {
            id: *id,
            name: title.clone(),
            type_: AssetType::Chat,
        })
        .collect();
    Ok(favorite_chats)
}

async fn get_assets_from_collections(
    collection_ids: Arc<Vec<Uuid>>,
) -> Result<Vec<FavoriteObject>> {
    let dashboards_handle = {
        let collection_ids = Arc::clone(&collection_ids);
        tokio::spawn(async move { get_dashboards_from_collections(&collection_ids).await })
    };

    let metrics_handle = {
        let collection_ids = Arc::clone(&collection_ids);
        tokio::spawn(async move { get_metrics_from_collections(&collection_ids).await })
    };

    let chats_handle = {
        let collection_ids = Arc::clone(&collection_ids);
        tokio::spawn(async move { get_chats_from_collections(&collection_ids).await })
    };

    let reports_handle = {
        let collection_ids = Arc::clone(&collection_ids);
        tokio::spawn(async move { get_reports_from_collections(&collection_ids).await })
    };

    let collection_name_handle = {
        let collection_ids = Arc::clone(&collection_ids);
        tokio::spawn(async move { get_collection_names(&collection_ids).await })
    };

    let (dashboards_res, metrics_res, chats_res, reports_res, collection_name_res) =
        match tokio::join!(dashboards_handle, metrics_handle, chats_handle, reports_handle, collection_name_handle) {
            (Ok(dashboards), Ok(metrics), Ok(chats), Ok(reports), Ok(collection_name)) => {
                (dashboards, metrics, chats, reports, collection_name)
            }
            _ => {
                return Err(anyhow!(
                    "Error getting assets from collection"
                ))
            }
        };

    let dashboards = match dashboards_res {
        Ok(dashboards) => dashboards,
        Err(e) => return Err(anyhow!("Error getting dashboards from collection: {:?}", e)),
    };

    let metrics = match metrics_res {
        Ok(metrics) => metrics,
        Err(e) => return Err(anyhow!("Error getting metrics from collection: {:?}", e)),
    };

    let chats = match chats_res {
        Ok(chats) => chats,
        Err(e) => return Err(anyhow!("Error getting chats from collection: {:?}", e)),
    };

    let reports = match reports_res {
        Ok(reports) => reports,
        Err(e) => return Err(anyhow!("Error getting reports from collection: {:?}", e)),
    };

    let collection_names = match collection_name_res {
        Ok(collection_names) => collection_names,
        Err(e) => return Err(anyhow!("Error getting collection name: {:?}", e)),
    };

    let mut collection_favorites: Vec<FavoriteObject> = Vec::new();

    for (collection_id, collection_name) in collection_names {
        let mut assets = Vec::new();

        assets.extend(
            dashboards
                .iter()
                .filter_map(|(dash_collection_id, favorite_object)| {
                    if *dash_collection_id == collection_id {
                        Some(favorite_object.clone())
                    } else {
                        None
                    }
                }),
        );

        assets.extend(
            metrics
                .iter()
                .filter_map(|(metric_collection_id, favorite_object)| {
                    if *metric_collection_id == collection_id {
                        Some(favorite_object.clone())
                    } else {
                        None
                    }
                }),
        );

        assets.extend(
            chats
                .iter()
                .filter_map(|(chat_collection_id, favorite_object)| {
                    if *chat_collection_id == collection_id {
                        Some(favorite_object.clone())
                    } else {
                        None
                    }
                }),
        );

        assets.extend(
            reports
                .iter()
                .filter_map(|(report_collection_id, favorite_object)| {
                    if *report_collection_id == collection_id {
                        Some(favorite_object.clone())
                    } else {
                        None
                    }
                }),
        );

        collection_favorites.push(FavoriteObject {
            id: collection_id,
            name: collection_name,
            type_: AssetType::Collection,
        });
    }

    Ok(collection_favorites)
}

async fn get_collection_names(collection_ids: &[Uuid]) -> Result<Vec<(Uuid, String)>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let collection_names = match collections::table
        .select((collections::id, collections::name))
        .filter(collections::id.eq_any(collection_ids))
        .filter(collections::deleted_at.is_null())
        .load::<(Uuid, String)>(&mut conn)
        .await
    {
        Ok(collection_names) => collection_names,
        Err(e) => return Err(anyhow!("Error loading collection name: {:?}", e)),
    };
    Ok(collection_names)
}

async fn get_dashboards_from_collections(
    collection_ids: &[Uuid],
) -> Result<Vec<(Uuid, FavoriteObject)>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let dashboard_records: Vec<(Uuid, Uuid, String)> = match dashboard_files::table
        .inner_join(
            collections_to_assets::table.on(dashboard_files::id.eq(collections_to_assets::asset_id)),
        )
        .select((
            collections_to_assets::collection_id,
            dashboard_files::id,
            dashboard_files::name,
        ))
        .filter(collections_to_assets::collection_id.eq_any(collection_ids))
        .filter(collections_to_assets::asset_type.eq(AssetType::DashboardFile))
        .filter(dashboard_files::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .load::<(Uuid, Uuid, String)>(&mut conn)
        .await
    {
        Ok(dashboard_records) => dashboard_records,
        Err(e) => return Err(anyhow!("Error loading dashboard records: {:?}", e)),
    };

    let dashboard_objects: Vec<(Uuid, FavoriteObject)> = dashboard_records
        .iter()
        .map(|(collection_id, id, name)| {
            (
                *collection_id,
                FavoriteObject {
                    id: *id,
                    name: name.clone(),
                    type_: AssetType::DashboardFile,
                },
            )
        })
        .collect();
    Ok(dashboard_objects)
}

async fn get_metrics_from_collections(
    collection_ids: &[Uuid],
) -> Result<Vec<(Uuid, FavoriteObject)>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let metric_records: Vec<(Uuid, Uuid, String)> = match metric_files::table
        .inner_join(
            collections_to_assets::table.on(metric_files::id.eq(collections_to_assets::asset_id)),
        )
        .select((
            collections_to_assets::collection_id,
            metric_files::id,
            metric_files::name,
        ))
        .filter(collections_to_assets::collection_id.eq_any(collection_ids))
        .filter(collections_to_assets::asset_type.eq(AssetType::MetricFile))
        .filter(metric_files::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .load::<(Uuid, Uuid, String)>(&mut conn)
        .await
    {
        Ok(metric_records) => metric_records,
        Err(e) => return Err(anyhow!("Error loading metric records: {:?}", e)),
    };

    let metric_objects: Vec<(Uuid, FavoriteObject)> = metric_records
        .iter()
        .map(|(collection_id, id, name)| {
            (
                *collection_id,
                FavoriteObject {
                    id: *id,
                    name: name.clone(),
                    type_: AssetType::MetricFile,
                },
            )
        })
        .collect();
    Ok(metric_objects)
}

async fn get_chats_from_collections(
    collection_ids: &[Uuid],
) -> Result<Vec<(Uuid, FavoriteObject)>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let chat_records: Vec<(Uuid, Uuid, String)> = match chats::table
        .inner_join(
            collections_to_assets::table.on(chats::id.eq(collections_to_assets::asset_id)),
        )
        .select((
            collections_to_assets::collection_id,
            chats::id,
            chats::title,
        ))
        .filter(collections_to_assets::collection_id.eq_any(collection_ids))
        .filter(collections_to_assets::asset_type.eq(AssetType::Chat))
        .filter(chats::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .load::<(Uuid, Uuid, String)>(&mut conn)
        .await
    {
        Ok(chat_records) => chat_records,
        Err(e) => return Err(anyhow!("Error loading chat records: {:?}", e)),
    };

    let chat_objects: Vec<(Uuid, FavoriteObject)> = chat_records
        .iter()
        .map(|(collection_id, id, title)| {
            (
                *collection_id,
                FavoriteObject {
                    id: *id,
                    name: title.clone(),
                    type_: AssetType::Chat,
                },
            )
        })
        .collect();
    Ok(chat_objects)
}

async fn get_reports_from_collections(
    collection_ids: &[Uuid],
) -> Result<Vec<(Uuid, FavoriteObject)>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let report_records: Vec<(Uuid, Uuid, String)> = match report_files::table
        .inner_join(
            collections_to_assets::table.on(report_files::id.eq(collections_to_assets::asset_id)),
        )
        .select((
            collections_to_assets::collection_id,
            report_files::id,
            report_files::name,
        ))
        .filter(collections_to_assets::collection_id.eq_any(collection_ids))
        .filter(collections_to_assets::asset_type.eq(AssetType::ReportFile))
        .filter(report_files::deleted_at.is_null())
        .filter(collections_to_assets::deleted_at.is_null())
        .load::<(Uuid, Uuid, String)>(&mut conn)
        .await
    {
        Ok(report_records) => report_records,
        Err(e) => return Err(anyhow!("Error loading report records: {:?}", e)),
    };

    let report_objects: Vec<(Uuid, FavoriteObject)> = report_records
        .iter()
        .map(|(collection_id, id, name)| {
            (
                *collection_id,
                FavoriteObject {
                    id: *id,
                    name: name.clone(),
                    type_: AssetType::ReportFile,
                },
            )
        })
        .collect();
    Ok(report_objects)
}

async fn get_favorite_metrics(metric_ids: Arc<Vec<Uuid>>) -> Result<Vec<FavoriteObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let metric_records: Vec<(Uuid, String)> = match metric_files::table
        .select((metric_files::id, metric_files::name))
        .filter(metric_files::id.eq_any(metric_ids.as_ref()))
        .filter(metric_files::deleted_at.is_null())
        .load::<(Uuid, String)>(&mut conn)
        .await
    {
        Ok(metric_records) => metric_records,
        Err(diesel::NotFound) => return Err(anyhow!("Metrics not found")),
        Err(e) => return Err(anyhow!("Error loading metric records: {:?}", e)),
    };

    let favorite_metrics = metric_records
        .iter()
        .map(|(id, name)| FavoriteObject {
            id: *id,
            name: name.clone(),
            type_: AssetType::MetricFile,
        })
        .collect();
    Ok(favorite_metrics)
}

async fn get_favorite_reports(report_ids: Arc<Vec<Uuid>>) -> Result<Vec<FavoriteObject>> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let report_records: Vec<(Uuid, String)> = match report_files::table
        .select((report_files::id, report_files::name))
        .filter(report_files::id.eq_any(report_ids.as_ref()))
        .filter(report_files::deleted_at.is_null())
        .load::<(Uuid, String)>(&mut conn)
        .await
    {
        Ok(report_records) => report_records,
        Err(diesel::NotFound) => return Err(anyhow!("Reports not found")),
        Err(e) => return Err(anyhow!("Error loading report records: {:?}", e)),
    };

    let favorite_reports = report_records
        .iter()
        .map(|(id, name)| FavoriteObject {
            id: *id,
            name: name.clone(),
            type_: AssetType::ReportFile,
        })
        .collect();
    Ok(favorite_reports)
}

pub async fn update_favorites(user: &AuthenticatedUser, favorites: &[Uuid]) -> Result<()> {
    let mut conn = match get_pg_pool().get().await {
        Ok(conn) => conn,
        Err(e) => return Err(anyhow!("Error getting connection from pool: {:?}", e)),
    };

    let favorite_records = match user_favorites::table
        .select((user_favorites::asset_id, user_favorites::asset_type))
        .filter(user_favorites::user_id.eq(user.id))
        .filter(user_favorites::deleted_at.is_null())
        .load::<(Uuid, AssetType)>(&mut conn)
        .await
    {
        Ok(favorites) => favorites,
        Err(e) => return Err(anyhow!("Error loading favorites: {:?}", e)),
    };

    // Create a map of asset_id to AssetType
    let favorite_map: std::collections::HashMap<Uuid, AssetType> =
        favorite_records.into_iter().collect();

    let mut new_favs = vec![];

    // Iterate through the favorites in the order they were provided
    for (index, favorite_id) in favorites.iter().enumerate() {
        if let Some(asset_type) = favorite_map.get(favorite_id) {
            let new_fav = UserFavorite {
                user_id: user.id,
                asset_id: *favorite_id,
                asset_type: *asset_type,
                order_index: index as i32,
                created_at: chrono::Utc::now(),
                deleted_at: None,
            };
            new_favs.push(new_fav);
        }
    }

    match insert_into(user_favorites::table)
        .values(new_favs)
        .on_conflict((
            user_favorites::user_id,
            user_favorites::asset_id,
            user_favorites::asset_type,
        ))
        .do_update()
        .set(user_favorites::order_index.eq(excluded(user_favorites::order_index)))
        .execute(&mut conn)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => Err(anyhow!("Error updating favorites: {:?}", e)),
    }
}
