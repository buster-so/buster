use anyhow::{anyhow, Result};
use middleware::AuthenticatedUser;

use search::{search as search_lib, SearchObject, SearchObjectType, SearchOptions};

pub async fn search_handler(
    user: &AuthenticatedUser,
    query: String,
    num_results: Option<i64>,
    asset_types: Option<Vec<SearchObjectType>>,
) -> Result<Vec<SearchObject>> {
    let num_results = num_results.unwrap_or(50);
    let asset_types = asset_types.unwrap_or_else(Vec::new);

    let options = SearchOptions::with_custom_options(num_results, asset_types);

    let user_organization = match user.organizations.get(0) {
        Some(org) => org,
        None => return Err(anyhow!("User doesn't belong to an organization")),
    };

    let results = search_lib(user.id, user_organization.id, query, options).await?;

    Ok(results)
}
