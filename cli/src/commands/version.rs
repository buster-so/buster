use anyhow::Result;
use reqwest::Client;
use serde::Deserialize;

const GITHUB_API_URL: &str = "https://api.github.com/repos/buster-so/buster/releases/latest";

#[derive(Deserialize)]
struct GitHubRelease {
    tag_name: String,
    body: Option<String>,
}

pub async fn check_latest_version() -> Result<Option<String>> {
    let client = Client::new();
    let response = client
        .get(GITHUB_API_URL)
        .header("User-Agent", "buster-cli")
        .send()
        .await?;

    let release: GitHubRelease = response.json().await?;
    Ok(Some(release.tag_name))
}

pub fn is_update_available(current: &str, latest: &str) -> bool {
    // Strip 'v' prefix if present
    let current = current.trim_start_matches('v');
    let latest = latest.trim_start_matches('v');

    // Split into version components
    let current_parts: Vec<&str> = current.split('.').collect();
    let latest_parts: Vec<&str> = latest.split('.').collect();

    // Compare version components
    for (c, l) in current_parts.iter().zip(latest_parts.iter()) {
        let c_num: u32 = c.parse().unwrap_or(0);
        let l_num: u32 = l.parse().unwrap_or(0);
        if l_num > c_num {
            return true;
        }
        if c_num > l_num {
            return false;
        }
    }

    // If we get here and latest has more components, it's newer
    latest_parts.len() > current_parts.len()
} 