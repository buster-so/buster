use colored::*;
use reqwest::Client;
use semver::Version;
use serde::Deserialize;
use std::time::Duration;

const GITHUB_API_LATEST_RELEASE_URL: &str =
    "https://api.github.com/repos/buster-so/buster/releases/latest";
const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION"); // Read current version from Cargo.toml
const USER_AGENT: &str = "buster-cli";

// Struct to deserialize the tag_name from the GitHub API response
#[derive(Deserialize, Debug)]
struct GitHubReleaseInfo {
    tag_name: String,
}

/// Checks GitHub Releases for a newer version of the CLI.
/// Prints a message to stderr indicating if an update is available.
/// Fails silently if there's an error checking (e.g., network issues).
pub async fn check_for_updates() {
    let client = Client::builder()
        .timeout(Duration::from_secs(3))
        .user_agent(USER_AGENT) // Add User-Agent header
        .build();

    let client = match client {
        Ok(c) => c,
        Err(e) => {
            // Log subtly
            eprintln!(
                "{}",
                format!("Failed to build HTTP client for update check: {}", e).yellow()
            );
            return;
        }
    };

    let response = match client.get(GITHUB_API_LATEST_RELEASE_URL).send().await {
        Ok(resp) => resp,
        Err(e) => {
            eprintln!("{}", format!("Update check failed: {}", e).yellow());
            return;
        }
    };

    if !response.status().is_success() {
        eprintln!(
            "{}",
            format!(
                "Update check received non-success status: {}\nURL: {}",
                response.status(),
                GITHUB_API_LATEST_RELEASE_URL
            )
            .yellow()
        );
        return;
    }

    let release_info = match response.json::<GitHubReleaseInfo>().await {
        Ok(info) => info,
        Err(e) => {
            eprintln!(
                "{}",
                format!("Failed to parse update check response: {}", e).yellow()
            );
            return;
        }
    };

    // Remove potential 'v' prefix from tag name
    let latest_version_str = release_info.tag_name.trim_start_matches('v');

    match (
        Version::parse(CURRENT_VERSION),
        Version::parse(latest_version_str),
    ) {
        (Ok(current), Ok(latest)) => {
            if latest > current {
                eprintln!(
                    "\n{}",
                    format!(
                        "A new version of buster ({}) is available! You have {}.",
                        latest, current
                    )
                    .red()
                    .bold()
                );
                eprintln!(
                    "{}",
                    "Please run `buster update` to get the latest version.".red()
                );
            }
            // No message if up-to-date
        }
        (Err(e), _) => {
            eprintln!(
                "{}",
                format!(
                    "Failed to parse current version ({}): {}",
                    CURRENT_VERSION, e
                )
                .yellow()
            );
        }
        (_, Err(e)) => {
            eprintln!(
                "{}",
                format!(
                    "Failed to parse latest version tag ('{}'): {}",
                    release_info.tag_name, // Show original tag in error
                    e
                )
                .yellow()
            );
        }
    }

    println!("\n");

}
