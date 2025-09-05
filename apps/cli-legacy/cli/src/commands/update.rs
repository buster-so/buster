use anyhow::{Result, Context};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;
use std::env;
use reqwest::Client;
use indicatif::{ProgressBar, ProgressStyle};
use colored::*;
use futures_util::StreamExt;
use inquire::Confirm;
use std::io::Write;
use zip::ZipArchive;

const GITHUB_RELEASES_URL: &str = "https://github.com/buster-so/buster/releases/download";

pub struct UpdateCommand {
    check_only: bool,
    force: bool,
    no_prompt: bool,
}

impl UpdateCommand {
    pub fn new(check_only: bool, force: bool, no_prompt: bool) -> Self {
        Self {
            check_only,
            force,
            no_prompt,
        }
    }

    pub async fn execute(&self) -> Result<()> {
        // Check current version and latest version
        let current_version = env!("CARGO_PKG_VERSION");
        let latest_version = crate::utils::version::check_latest_version()
            .await?;

        println!("Current version: {}", current_version);
        println!("Latest version: {}", latest_version);

        if env::var("BUSTER_DEBUG").is_ok() {
            println!("Debug: Checking GitHub API URL: {}", GITHUB_RELEASES_URL);
        }

        let update_available = crate::utils::version::is_update_available(current_version, &latest_version);
        
        if !update_available {
            if self.force {
                println!("\n⚠️  Warning: The latest version ({}) is older than your current version ({})", latest_version, current_version);
                println!("   Continuing due to --force flag...");
            } else {
                println!("\n{}", "You are using the latest version".green());
                return Ok(());
            }
        }

        if self.check_only {
            if update_available {
                println!("\n{}", "Update available!".yellow().bold());
                println!("Run {} to update", "buster update".cyan());
            }
            return Ok(());
        }

        if !self.no_prompt {
            let confirm = Confirm::new("Do you want to update to the latest version?")
                .with_default(true)
                .with_help_message("This will replace your current binary with the latest version")
                .prompt();

            match confirm {
                Ok(true) => (),
                Ok(false) => {
                    println!("Update cancelled");
                    return Ok(());
                }
                Err(_) => {
                    return Err(anyhow::anyhow!("Update cancelled due to input error"));
                }
            }
        }

        self.perform_update(&latest_version).await
    }

    async fn perform_update(&self, version: &str) -> Result<()> {
        let package_name = self.get_package_name()?;
        let download_url = format!("{}/{}/{}", GITHUB_RELEASES_URL, version, package_name);
        let checksum_url = format!("{}.sha256", download_url);

        if env::var("BUSTER_DEBUG").is_ok() {
            println!("Debug: Download URL: {}", download_url);
            println!("Debug: Checksum URL: {}", checksum_url);
        }

        println!("\nDownloading update...");
        
        // Create temporary directory
        let temp_dir = tempfile::Builder::new()
            .prefix("buster-update-")
            .tempdir()?;
        
        // Download package
        let package_path = temp_dir.path().join(&package_name);
        match self.download_file(&download_url, &package_path).await {
            Ok(_) => println!("✓ Package downloaded successfully"),
            Err(e) => return Err(anyhow::anyhow!("Failed to download package: {}\nURL: {}", e, download_url)),
        }

        // Download and verify checksum
        let checksum_path = temp_dir.path().join(format!("{}.sha256", package_name));
        match self.download_file(&checksum_url, &checksum_path).await {
            Ok(_) => {
                println!("✓ Checksum file downloaded");
                self.verify_checksum(&package_path, &checksum_path)?;
                println!("✓ Checksum verified");
            },
            Err(e) => {
                if env::var("BUSTER_DEV").is_ok() {
                    println!("Skipping checksum verification in development mode");
                } else {
                    return Err(anyhow::anyhow!("Failed to download checksum: {}\nURL: {}", e, checksum_url));
                }
            }
        }

        // Get current binary path
        let current_binary = env::current_exe()?;
        let backup_path = current_binary.with_extension("bak");

        // Create backup
        println!("Creating backup...");
        fs::copy(&current_binary, &backup_path)?;

        // Extract and replace binary
        println!("Installing update...");
        self.replace_binary(&package_path, &current_binary)?;

        // Verify new binary
        if self.verify_new_binary(&current_binary)? {
            fs::remove_file(backup_path)?;
            println!("\n{}", "✓ Successfully updated!".green().bold());
            println!("Version: {}", version);
        } else {
            println!("\n{}", "✗ Update verification failed, rolling back...".red());
            fs::copy(&backup_path, &current_binary)?;
            return Err(anyhow::anyhow!("Failed to verify new binary"));
        }

        Ok(())
    }

    fn get_package_name(&self) -> Result<String> {
        let os = env::consts::OS;
        let arch = env::consts::ARCH;

        let package_name = match (os, arch) {
            ("linux", "x86_64") => "buster-cli-linux-x86_64.tar.gz",
            ("macos", "x86_64") => "buster-cli-darwin-x86_64.tar.gz",
            ("macos", "aarch64") => "buster-cli-darwin-arm64.tar.gz",
            ("windows", "x86_64") => "buster-cli-windows-x86_64.zip",
            _ => return Err(anyhow::anyhow!("Unsupported platform: {}-{}", os, arch)),
        };

        Ok(package_name.to_string())
    }

    async fn download_file(&self, url: &str, path: &Path) -> Result<()> {
        let client = Client::new();
        let response = client
            .get(url)
            .header("User-Agent", "buster-cli")
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to download file: HTTP {}\nURL: {}",
                response.status(),
                url
            ));
        }

        let total_size = response.content_length().unwrap_or(0);
        let pb = ProgressBar::new(total_size);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("[{elapsed_precise}] [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({eta})")
                .unwrap()
                .progress_chars("#>-"),
        );

        let mut file = fs::File::create(path)?;
        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            pb.inc(chunk.len() as u64);
            file.write_all(&chunk)?;
        }

        pb.finish_and_clear();
        Ok(())
    }

    fn verify_checksum(&self, package_path: &Path, checksum_path: &Path) -> Result<()> {
        // For local development, skip checksum verification if env var is set
        if env::var("BUSTER_DEV").is_ok() {
            println!("Skipping checksum verification in development mode");
            return Ok(());
        }

        let expected_checksum = fs::read_to_string(checksum_path)?;
        let expected_checksum = expected_checksum.split_whitespace().next()
            .context("Invalid checksum file format")?;

        let output = Command::new("shasum")
            .arg("-a")
            .arg("256")
            .arg(package_path)
            .output()?;

        let actual_checksum = String::from_utf8(output.stdout)?;
        let actual_checksum = actual_checksum.split_whitespace().next()
            .context("Failed to compute checksum")?;

        if actual_checksum != expected_checksum {
            return Err(anyhow::anyhow!(
                "Checksum verification failed\nExpected: {}\nGot: {}",
                expected_checksum,
                actual_checksum
            ));
        }

        Ok(())
    }

    fn replace_binary(&self, package_path: &Path, target_path: &Path) -> Result<()> {
        // Extract the package based on its extension
        if package_path.extension().and_then(|s| s.to_str()) == Some("zip") {
            // Handle ZIP files (Windows)
            let file = fs::File::open(package_path)?;
            let mut archive = ZipArchive::new(file)?;
            
            // Extract the binary
            let mut binary = archive.by_name("buster-cli.exe")?;
            let mut temp_path = package_path.parent().unwrap().join("buster-cli.exe");
            let mut outfile = fs::File::create(&temp_path)?;
            std::io::copy(&mut binary, &mut outfile)?;
            
            // Move to target location
            fs::rename(temp_path, target_path)?;
        } else {
            // Handle tar.gz files (Unix)
            Command::new("tar")
                .arg("xzf")
                .arg(package_path)
                .current_dir(package_path.parent().unwrap())
                .output()?;

            // Move the extracted binary to the target location
            let extracted_binary = package_path.parent().context("Invalid package path")?.join("buster-cli");
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let metadata = fs::metadata(&extracted_binary)?;
                let mut perms = metadata.permissions();
                perms.set_mode(0o755);
                fs::set_permissions(&extracted_binary, perms)?;
            }
            fs::rename(extracted_binary, target_path)?
        }

        Ok(())
    }

    fn verify_new_binary(&self, binary_path: &Path) -> Result<bool> {
        let output = Command::new(binary_path)
            .arg("version")
            .output()?;

        Ok(output.status.success())
    }
} 