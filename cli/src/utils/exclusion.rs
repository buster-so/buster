use anyhow::{Result, anyhow};
use glob::Pattern;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Unified BusterConfig structure for configuration across all commands
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct BusterConfig {
    pub data_source_name: Option<String>,
    pub schema: Option<String>,
    pub database: Option<String>,
    pub exclude_files: Option<Vec<String>>,
    pub exclude_tags: Option<Vec<String>>,
}

impl BusterConfig {
    /// Validates all exclude patterns to ensure they are valid glob patterns
    pub fn validate_exclude_patterns(&self) -> Result<()> {
        if let Some(patterns) = &self.exclude_files {
            for pattern in patterns {
                match Pattern::new(pattern) {
                    Ok(_) => continue,
                    Err(e) => return Err(anyhow!("Invalid glob pattern '{}': {}", pattern, e)),
                }
            }
        }
        Ok(())
    }

    /// Load configuration from the specified directory
    pub fn load_from_dir(dir: &Path) -> Result<Option<Self>> {
        let config_path = dir.join("buster.yml");
        if config_path.exists() {
            let content = std::fs::read_to_string(&config_path)
                .map_err(|e| anyhow!("Failed to read buster.yml: {}", e))?;

            if content.trim().is_empty() {
                return Ok(None);
            }

            let config: Self = serde_yaml::from_str(&content)
                .map_err(|e| anyhow!("Failed to parse buster.yml: {}", e))?;

            // Validate exclude patterns
            config.validate_exclude_patterns()?;

            // Log configuration details
            if let Some(ref data_source) = config.data_source_name {
                println!("ℹ️  Data source: {}", data_source);
            }
            if let Some(ref schema) = config.schema {
                println!("ℹ️  Schema: {}", schema);
            }
            if let Some(ref database) = config.database {
                println!("ℹ️  Database: {}", database);
            }
            
            // Log exclude patterns if present
            if let Some(ref patterns) = config.exclude_files {
                println!("ℹ️  Found {} exclude file pattern(s):", patterns.len());
                for pattern in patterns {
                    println!("   - {}", pattern);
                }
            }
            
            // Log exclude tags if present
            if let Some(ref tags) = config.exclude_tags {
                println!("ℹ️  Found {} exclude tag(s):", tags.len());
                for tag in tags {
                    println!("   - {}", tag);
                }
            }

            Ok(Some(config))
        } else {
            Ok(None)
        }
    }
}

/// Manager for handling all exclusion logic
pub struct ExclusionManager {
    exclude_patterns: Vec<Pattern>,
    exclude_tags: Vec<String>,
}

impl ExclusionManager {
    /// Create a new ExclusionManager from a BusterConfig
    pub fn new(config: &BusterConfig) -> Result<Self> {
        // Compile glob patterns once
        let exclude_patterns: Vec<Pattern> = if let Some(patterns) = &config.exclude_files {
            println!("🔍 Initializing exclude patterns: {:?}", patterns);
            patterns.iter()
                .filter_map(|p| match Pattern::new(p) {
                    Ok(pattern) => {
                        println!("✅ Compiled pattern: {}", p);
                        Some(pattern)
                    }
                    Err(e) => {
                        println!("⚠️  Warning: Invalid exclude pattern '{}': {}", p, e);
                        None
                    }
                })
                .collect()
        } else {
            Vec::new()
        };

        // Get exclude tags if any
        let exclude_tags = if let Some(tags) = &config.exclude_tags {
            tags.clone()
        } else {
            Vec::new()
        };

        Ok(Self {
            exclude_patterns,
            exclude_tags,
        })
    }

    /// Create an ExclusionManager with empty exclusions
    pub fn empty() -> Self {
        Self {
            exclude_patterns: Vec::new(),
            exclude_tags: Vec::new(),
        }
    }

    /// Check if a file should be excluded based on its path
    pub fn should_exclude_file(&self, path: &Path, base_dir: &Path) -> (bool, Option<String>) {
        if self.exclude_patterns.is_empty() {
            return (false, None);
        }

        // Get relative path for matching
        let relative_path = path.strip_prefix(base_dir)
            .unwrap_or(path)
            .to_string_lossy();

        // Check if file matches any exclude pattern
        for pattern in &self.exclude_patterns {
            let matches = pattern.matches(&relative_path);
            println!("  - Testing pattern '{}' against '{}': {}", pattern.as_str(), relative_path, matches);
            
            if matches {
                return (true, Some(pattern.as_str().to_string()));
            }
        }

        (false, None)
    }

    /// Check if content contains any excluded tags
    pub fn should_exclude_by_tags(&self, content: &str) -> (bool, Option<String>) {
        if self.exclude_tags.is_empty() {
            return (false, None);
        }

        lazy_static! {
            static ref TAG_RE: Regex = Regex::new(
                r#"(?i)tags\s*=\s*\[\s*([^\]]+)\s*\]"#
            ).unwrap();
        }
        
        if let Some(cap) = TAG_RE.captures(content) {
            let tags_str = cap[1].to_string();
            // Split the tags string and trim each tag
            let tags: Vec<String> = tags_str
                .split(',')
                .map(|tag| tag.trim().trim_matches('"').trim_matches('\'').to_lowercase())
                .collect();
            
            // Check if any excluded tag is in the content's tags
            for exclude_tag in &self.exclude_tags {
                let exclude_tag_lower = exclude_tag.to_lowercase();
                if tags.contains(&exclude_tag_lower) {
                    return (true, Some(exclude_tag.clone()));
                }
            }
        }
        
        (false, None)
    }
}

/// A progress reporter for file processing with exclusion support
pub struct ProgressReporter {
    pub total_files: usize,
    pub processed: usize,
    pub excluded_files: usize,
    pub excluded_tags: usize,
    pub current_file: String,
    pub status: String,
}

impl ProgressReporter {
    pub fn new(total_files: usize) -> Self {
        Self {
            total_files,
            processed: 0,
            excluded_files: 0,
            excluded_tags: 0,
            current_file: String::new(),
            status: String::new(),
        }
    }

    pub fn log_progress(&self) {
        println!(
            "\n[{}/{}] Processing: {}",
            self.processed, self.total_files, self.current_file
        );
        println!("Status: {}", self.status);
    }

    pub fn log_error(&self, error: &str) {
        eprintln!("❌ Error processing {}: {}", self.current_file, error);
    }

    pub fn log_success(&self) {
        println!("✅ Successfully processed: {}", self.current_file);
    }

    pub fn log_warning(&self, warning: &str) {
        println!("⚠️  Warning for {}: {}", self.current_file, warning);
    }

    pub fn log_info(&self, info: &str) {
        println!("ℹ️  {}: {}", self.current_file, info);
    }

    pub fn log_excluded_file(&mut self, path: &str, pattern: &str) {
        self.excluded_files += 1;
        println!("⛔ Excluding file: {} (matched pattern: {})", path, pattern);
    }

    pub fn log_excluded_tag(&mut self, path: &str, tag: &str) {
        self.excluded_tags += 1;
        println!("⛔ Excluding file: {} (matched excluded tag: {})", path, tag);
    }

    pub fn log_summary(&self) {
        println!("\n📊 Processing Summary");
        println!("==================");
        println!("✅ Successfully processed: {} files", self.processed - self.excluded_files - self.excluded_tags);
        if self.excluded_files > 0 {
            println!("⛔ Excluded by pattern: {} files", self.excluded_files);
        }
        if self.excluded_tags > 0 {
            println!("⛔ Excluded by tag: {} files", self.excluded_tags);
        }
    }
}

/// Progress tracker trait for file operations
pub trait ProgressTracker {
    fn log_excluded_file(&mut self, path: &str, pattern: &str);
    fn log_excluded_tag(&mut self, path: &str, tag: &str);
}

// Implement the trait for our ProgressReporter
impl ProgressTracker for ProgressReporter {
    fn log_excluded_file(&mut self, path: &str, pattern: &str) {
        self.excluded_files += 1;
        println!("⛔ Excluding file: {} (matched pattern: {})", path, pattern);
    }

    fn log_excluded_tag(&mut self, path: &str, tag: &str) {
        self.excluded_tags += 1;
        println!("⛔ Excluding file: {} (matched excluded tag: {})", path, tag);
    }
}

/// Find YML files in a directory that match the exclusion criteria
pub fn find_yml_files<P: ProgressTracker>(
    dir: &Path, 
    recursive: bool, 
    exclusion_manager: &ExclusionManager,
    mut progress_reporter: Option<&mut P>
) -> Result<Vec<PathBuf>> {
    let mut result = Vec::new();

    if !dir.is_dir() {
        return Err(anyhow!("Path is not a directory: {}", dir.display()));
    }

    // Use WalkDir for recursive search, or just read_dir for non-recursive
    let entries = if recursive {
        let mut entries = Vec::new();
        for entry in WalkDir::new(dir)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            entries.push(entry.path().to_path_buf());
        }
        entries
    } else {
        let mut entries = Vec::new();
        for entry in std::fs::read_dir(dir)? {
            entries.push(entry?.path());
        }
        entries
    };

    // Filter entries for YML files
    for path in entries {
        // Skip buster.yml files
        if path.file_name().and_then(|n| n.to_str()) == Some("buster.yml") {
            continue;
        }

        if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("yml") {
            // Check if file should be excluded by pattern
            let (should_exclude, pattern) = exclusion_manager.should_exclude_file(&path, dir);
            if should_exclude {
                let pattern_str = pattern.unwrap_or_default();
                let path_str = path.display().to_string();
                
                // Log via progress reporter if available
                if let Some(progress) = progress_reporter.as_mut() {
                    progress.log_excluded_file(&path_str, &pattern_str);
                } else {
                    println!("⛔ Excluding file: {} (matched pattern: {})", path_str, pattern_str);
                }
                continue;
            }

            // Only check content for tags if we have exclude_tags
            if !exclusion_manager.exclude_tags.is_empty() {
                // Read file content to check for tags
                match std::fs::read_to_string(&path) {
                    Ok(content) => {
                        let (should_exclude, tag) = exclusion_manager.should_exclude_by_tags(&content);
                        if should_exclude {
                            let tag_str = tag.unwrap_or_default();
                            let path_str = path.display().to_string();
                            
                            // Log via progress reporter if available
                            if let Some(progress) = progress_reporter.as_mut() {
                                progress.log_excluded_tag(&path_str, &tag_str);
                            } else {
                                println!("⛔ Excluding file: {} (matched excluded tag: {})", path_str, tag_str);
                            }
                            continue;
                        }
                    },
                    Err(e) => {
                        println!("⚠️  Warning: Failed to read file for tag checking: {} - {}", path.display(), e);
                    }
                }
            }

            result.push(path);
        }
    }

    Ok(result)
}

/// Find SQL files in a directory that match the exclusion criteria
pub fn find_sql_files<P: ProgressTracker>(
    dir: &Path, 
    recursive: bool, 
    exclusion_manager: &ExclusionManager,
    mut progress_reporter: Option<&mut P>
) -> Result<Vec<PathBuf>> {
    let mut result = Vec::new();

    if !dir.is_dir() {
        return Err(anyhow!("Path is not a directory: {}", dir.display()));
    }

    // Use WalkDir for recursive search, or just read_dir for non-recursive
    let entries = if recursive {
        let mut entries = Vec::new();
        for entry in WalkDir::new(dir)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            entries.push(entry.path().to_path_buf());
        }
        entries
    } else {
        let mut entries = Vec::new();
        for entry in std::fs::read_dir(dir)? {
            entries.push(entry?.path());
        }
        entries
    };

    // Filter entries for SQL files
    for path in entries {
        if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("sql") {
            // Check if file should be excluded by pattern
            let (should_exclude, pattern) = exclusion_manager.should_exclude_file(&path, dir);
            if should_exclude {
                let pattern_str = pattern.unwrap_or_default();
                let path_str = path.display().to_string();
                
                // Log via progress reporter if available
                if let Some(progress) = progress_reporter.as_mut() {
                    progress.log_excluded_file(&path_str, &pattern_str);
                } else {
                    println!("⛔ Excluding file: {} (matched pattern: {})", path_str, pattern_str);
                }
                continue;
            }

            // Only check content for tags if we have exclude_tags
            if !exclusion_manager.exclude_tags.is_empty() {
                // Read file content to check for tags
                match std::fs::read_to_string(&path) {
                    Ok(content) => {
                        let (should_exclude, tag) = exclusion_manager.should_exclude_by_tags(&content);
                        if should_exclude {
                            let tag_str = tag.unwrap_or_default();
                            let path_str = path.display().to_string();
                            
                            // Log via progress reporter if available
                            if let Some(progress) = progress_reporter.as_mut() {
                                progress.log_excluded_tag(&path_str, &tag_str);
                            } else {
                                println!("⛔ Excluding file: {} (matched excluded tag: {})", path_str, tag_str);
                            }
                            continue;
                        }
                    },
                    Err(e) => {
                        println!("⚠️  Warning: Failed to read file for tag checking: {} - {}", path.display(), e);
                    }
                }
            }

            result.push(path);
        }
    }

    Ok(result)
} 