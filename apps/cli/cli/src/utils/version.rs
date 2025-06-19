use anyhow::{Result, Context};
use reqwest::Client;
use semver::Version; // Assuming we'll use the semver crate for version comparison

const GITHUB_RELEASES_API_URL: &str = "https://api.github.com/repos/buster-so/buster/releases/latest";
// If GITHUB_RELEASES_URL is different from the API url, it should be defined here too or passed.
// For now, assuming check_latest_version uses GITHUB_RELEASES_API_URL or a similar mechanism.

/// Fetches the latest version string from the GitHub releases API.
pub async fn check_latest_version() -> Result<String> {
    let client = Client::new();
    let response = client
        .get(GITHUB_RELEASES_API_URL)
        .header("User-Agent", "buster-cli") // Important for GitHub API
        .send()
        .await
        .context("Failed to send request to GitHub API")?;

    if !response.status().is_success() {
        return Err(anyhow::anyhow!(
            "GitHub API request failed with status: {}",
            response.status()
        ));
    }

    let release_info: serde_json::Value = response
        .json()
        .await
        .context("Failed to parse JSON response from GitHub API")?;

    let latest_version = release_info["tag_name"]
        .as_str()
        .context("Failed to extract tag_name from GitHub API response")?
        .trim_start_matches('v') // Remove 'v' prefix if present, e.g., v0.1.0 -> 0.1.0
        .to_string();

    Ok(latest_version)
}

/// Compares the current version with the latest version to see if an update is available.
/// Returns true if latest_version is greater than current_version.
pub fn is_update_available(current_version_str: &str, latest_version_str: &str) -> bool {
    match (Version::parse(current_version_str), Version::parse(latest_version_str)) {
        (Ok(current), Ok(latest)) => latest > current,
        _ => false, // If parsing fails, assume no update or handle error as needed
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_update_available_major() {
        assert!(is_update_available("1.0.0", "2.0.0"));
    }

    #[test]
    fn test_is_update_available_minor() {
        assert!(is_update_available("1.0.0", "1.1.0"));
    }

    #[test]
    fn test_is_update_available_patch() {
        assert!(is_update_available("1.0.0", "1.0.1"));
    }

    #[test]
    fn test_is_update_available_no_update() {
        assert!(!is_update_available("1.0.0", "1.0.0"));
    }

    #[test]
    fn test_is_update_available_older() {
        assert!(!is_update_available("2.0.0", "1.0.0"));
    }

    #[test]
    fn test_is_update_available_prerelease_newer() {
        assert!(is_update_available("1.0.0-alpha", "1.0.0"));
    }
    
    #[test]
    fn test_is_update_available_current_prerelease_older() {
        assert!(!is_update_available("1.0.0", "1.0.0-beta"));
    }

    #[test]
    fn test_is_update_available_invalid_current() {
        assert!(!is_update_available("invalid", "1.0.0"));
    }

    #[test]
    fn test_is_update_available_invalid_latest() {
        assert!(!is_update_available("1.0.0", "invalid"));
    }
} 