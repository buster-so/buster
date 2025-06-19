use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use diesel::{ExpressionMethods, QueryDsl};
use diesel_async::RunQueryDsl;
use middleware::types::AuthenticatedUser;
use serde::{Deserialize, Serialize};

use database::{
    enums::{DataSourceType, UserOrganizationRole},
    pool::get_pg_pool,
    schema::data_sources,
};

#[derive(Deserialize)]
pub struct ListDataSourcesRequest {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

#[derive(Serialize)]
pub struct DataSourceListItem {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub type_: DataSourceType,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_data_sources_handler(
    user: &AuthenticatedUser,
    page: Option<i64>,
    page_size: Option<i64>,
) -> Result<Vec<DataSourceListItem>> {
    // Verify user has an organization
    if user.organizations.is_empty() {
        return Err(anyhow!("User is not a member of any organization"));
    }

    // Get the first organization (users can only belong to one organization currently)
    let user_org = &user.organizations[0];
    
    // Verify user has appropriate permissions (at least viewer role)
    if user_org.role != UserOrganizationRole::WorkspaceAdmin 
       && user_org.role != UserOrganizationRole::DataAdmin
       && user_org.role != UserOrganizationRole::Querier
       && user_org.role != UserOrganizationRole::RestrictedQuerier
       && user_org.role != UserOrganizationRole::Viewer {
        return Err(anyhow!("User does not have appropriate permissions to view data sources"));
    }
    
    let page = page.unwrap_or(0);
    let page_size = page_size.unwrap_or(25);

    let mut conn = get_pg_pool().get().await?;

    // Get data sources for the organization (using organization ID from AuthenticatedUser)
    let data_sources_list = data_sources::table
        .filter(data_sources::organization_id.eq(user_org.id))
        .filter(data_sources::deleted_at.is_null())
        .order_by(data_sources::updated_at.desc())
        .limit(page_size)
        .offset(page * page_size)
        .load::<database::models::DataSource>(&mut conn)
        .await
        .map_err(|e| anyhow!("Unable to fetch data sources: {}", e))?;

    // Transform to response format
    let response_items = data_sources_list
        .into_iter()
        .map(|ds| DataSourceListItem {
            id: ds.id.to_string(),
            name: ds.name,
            type_: ds.type_,
            updated_at: ds.updated_at,
        })
        .collect();

    Ok(response_items)
}