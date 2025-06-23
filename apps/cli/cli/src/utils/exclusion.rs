use anyhow::{Result, anyhow};
use glob::Pattern;
use lazy_static::lazy_static;
use regex::Regex;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

// Import BusterConfig potentially needed by ExclusionManager::new
// We will fix this import path after updating mod.rs
use crate::utils::config::BusterConfig;
// Import ProgressTracker needed by find_* functions
use crate::utils::progress::ProgressTracker;

/// Manager for handling all exclusion logic
pub struct ExclusionManager {
    exclude_patterns: Vec<Pattern>,
    exclude_tags: Vec<String>,
}

impl ExclusionManager {
    /// Create a new ExclusionManager from a BusterConfig
    /// TODO: This needs to be context-aware. It currently only uses top-level excludes.
    /// It should probably take the specific context for the current operation.
    pub fn new(config: &BusterConfig) -> Result<Self> {
        // Compile glob patterns once from top-level config (for now)
        let exclude_patterns: Vec<Pattern> = if let Some(patterns) = &config.exclude_files {
            println!("🔍 Initializing exclude patterns: {:?}", config.exclude_files.as_ref().unwrap_or(&vec![]));
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

        // Get exclude tags if any from top-level config (for now)
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
            // Consider adding debug logging here if needed
            // println!("  - Testing pattern '{}' against '{}': {}", pattern.as_str(), relative_path, matches);
            
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
                r#"(?i)tags\s*=\s*\[\s*([^\\\]]+)\s*\]"# // Escaped closing bracket
            ).unwrap();
        }
        
        if let Some(cap) = TAG_RE.captures(content) {
            if let Some(tags_match) = cap.get(1) { // Use get(1) for safety
                let tags_str = tags_match.as_str();
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
        }
        
        (false, None)
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
    let walker = WalkDir::new(dir).follow_links(true);
    let entries_iterator: Box<dyn Iterator<Item = PathBuf>> = if recursive {
        Box::new(walker.into_iter().filter_map(|e| e.ok()).map(|e| e.path().to_path_buf()))
    } else {
        Box::new(std::fs::read_dir(dir)?.filter_map(|e| e.ok()).map(|e| e.path()))
    };

    // Filter entries for YML files
    for path in entries_iterator {
        // Skip buster.yml files
        if path.file_name().and_then(|n| n.to_str()) == Some("buster.yml") {
            continue;
        }
        // Skip directories explicitly if not recursing (read_dir includes them)
        if !recursive && path.is_dir() {
             continue;
        }

        if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("yml") {
            // Check if file should be excluded by pattern
            let (should_exclude, pattern) = exclusion_manager.should_exclude_file(&path, dir);
            if should_exclude {
                if let Some(pattern_str) = pattern {
                    let path_str = path.display().to_string();
                    if let Some(progress) = progress_reporter.as_mut() {
                        progress.log_excluded_file(&path_str, &pattern_str);
                    }
                }
                continue;
            }

            // Only check content for tags if we have exclude_tags
            if !exclusion_manager.exclude_tags.is_empty() {
                match std::fs::read_to_string(&path) {
                    Ok(content) => {
                        let (should_exclude, tag) = exclusion_manager.should_exclude_by_tags(&content);
                        if should_exclude {
                            if let Some(tag_str) = tag {
                                let path_str = path.display().to_string();
                                if let Some(progress) = progress_reporter.as_mut() {
                                    progress.log_excluded_tag(&path_str, &tag_str);
                                }
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
    let walker = WalkDir::new(dir).follow_links(true);
    let entries_iterator: Box<dyn Iterator<Item = PathBuf>> = if recursive {
        Box::new(walker.into_iter().filter_map(|e| e.ok()).map(|e| e.path().to_path_buf()))
    } else {
        Box::new(std::fs::read_dir(dir)?.filter_map(|e| e.ok()).map(|e| e.path()))
    };

    // Filter entries for SQL files
    for path in entries_iterator {
         // Skip directories explicitly if not recursing
        if !recursive && path.is_dir() {
            continue;
       }

        if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("sql") {
            // Check if file should be excluded by pattern
            let (should_exclude, pattern) = exclusion_manager.should_exclude_file(&path, dir);
            if should_exclude {
                 if let Some(pattern_str) = pattern {
                     let path_str = path.display().to_string();
                     if let Some(progress) = progress_reporter.as_mut() {
                         progress.log_excluded_file(&path_str, &pattern_str);
                     }
                 }
                continue;
            }

            // Only check content for tags if we have exclude_tags
            if !exclusion_manager.exclude_tags.is_empty() {
                match std::fs::read_to_string(&path) {
                    Ok(content) => {
                        let (should_exclude, tag) = exclusion_manager.should_exclude_by_tags(&content);
                        if should_exclude {
                            if let Some(tag_str) = tag {
                                let path_str = path.display().to_string();
                                if let Some(progress) = progress_reporter.as_mut() {
                                     progress.log_excluded_tag(&path_str, &tag_str);
                                }
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