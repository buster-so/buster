use std::{
    fs, io,
    path::{Component, Path, PathBuf},
};

/// Represents the part of the input string that is being considered for path completion.
#[derive(Debug)] // Added Debug for easier inspection
pub struct PathCompletionTarget<'a> {
    /// The full path fragment identified in the input (e.g., "edit src/ma" -> "src/ma").
    pub fragment: &'a str,
    /// The directory part *relative to the start of the fragment* (e.g., "src/").
    base_dir_str: &'a str,
    /// The part of the filename/dirname being typed (e.g., "ma").
    prefix: &'a str,
    /// The absolute path to the directory to search in initially.
    search_dir: PathBuf,
    /// Start index of the fragment within the original input string.
    pub fragment_start_index: usize,
}

/// Parses the input string to find the last potential path fragment.
/// Returns None if no path-like fragment is found at the end.
fn parse_input_for_completion<'a>(input: &'a str, cwd: &Path) -> Option<PathCompletionTarget<'a>> {
    // Find the start of the last "token" (space-separated)
    let token_start_index = input.rfind(' ').map_or(0, |i| i + 1);
    let potential_fragment = &input[token_start_index..];

    // Handle empty input or input ending with space
    if potential_fragment.is_empty() {
        if input.is_empty() || input.ends_with(' ') {
            // Offer completions from CWD for empty input or space-terminated input
            return Some(PathCompletionTarget {
                fragment: "",
                base_dir_str: "",
                prefix: "",
                search_dir: cwd.to_path_buf(),
                fragment_start_index: input.len(), // At the end
            });
        } else {
            // Don't autocomplete mid-word *unless* it looks like a path
            if !potential_fragment.contains('/') && !potential_fragment.starts_with('.') {
                return None;
            }
        }
    }

    // For any non-empty fragment, we'll try to offer completions
    // Whether or not it contains path separators
    
    // Find the last path separator to determine base directory and prefix
    let (fragment_base_dir_str, prefix) = match potential_fragment.rfind('/') {
        Some(sep_index) => {
            // Example: "cli/src/ma" -> base="cli/src/", prefix="ma"
            // Example: "cli/src/"   -> base="cli/src/", prefix=""
            (&potential_fragment[..=sep_index], &potential_fragment[sep_index + 1..])
        }
        None => {
            // Example: "chat"       -> base="", prefix="chat"
            // Treat any word as a potential filename or directory name
            ("", potential_fragment)
        }
    };

    let base_path_from_fragment = PathBuf::from(fragment_base_dir_str);
    let mut search_dir_abs = cwd.to_path_buf();
    search_dir_abs.push(base_path_from_fragment);

    // Basic security/sanity check: prevent "escaping" the CWD with excessive "../"
    let canonical_search = match search_dir_abs.canonicalize() {
        Ok(p) => p,
        Err(_) => {
            // If the base directory doesn't exist, default to CWD for searching
            return Some(PathCompletionTarget {
                fragment: potential_fragment,
                base_dir_str: "",
                prefix: potential_fragment, // Use the whole fragment as prefix
                search_dir: cwd.to_path_buf(),
                fragment_start_index: token_start_index,
            });
        }
    };

    let canonical_cwd = match cwd.canonicalize() {
        Ok(p) => p,
        Err(_) => return None, // Should not happen normally
    };
    
    if !canonical_search.starts_with(&canonical_cwd) {
        // Fall back to CWD for security
        return Some(PathCompletionTarget {
            fragment: potential_fragment,
            base_dir_str: "",
            prefix: potential_fragment, // Use the whole fragment as prefix
            search_dir: cwd.to_path_buf(),
            fragment_start_index: token_start_index,
        });
    }

    Some(PathCompletionTarget {
        fragment: potential_fragment,
        base_dir_str: fragment_base_dir_str, // Relative path part within the fragment
        prefix,
        search_dir: canonical_search,
        fragment_start_index: token_start_index,
    })
}

/// Recursively finds path completions within a directory.
fn find_completions_recursive(
    current_dir: &Path,
    base_prefix_lower: &str,
    relative_path: &Path,
    completions: &mut Vec<PathBuf>,
    max_depth: u32,
) -> io::Result<()> {
    if max_depth == 0 {
        return Ok(());
    }

    let entries = match fs::read_dir(current_dir) {
        Ok(reader) => reader,
        Err(e) => {
            // Ignore permission errors, log others if needed
            if e.kind() != io::ErrorKind::PermissionDenied {
                 eprintln!("Error reading directory {:?}: {}", current_dir, e);
            }
            return Ok(()); // Continue searching other branches
        }
    };

    for entry_result in entries {
        if let Ok(entry) = entry_result {
            if let Some(name) = entry.file_name().to_str() {
                // Skip hidden files/dirs unless prefix explicitly starts with .
                if name.starts_with('.') && !base_prefix_lower.starts_with('.') {
                    continue;
                }

                let entry_path_relative = relative_path.join(name);
                let entry_path_str = entry_path_relative.to_string_lossy().to_lowercase();
                let name_lower = name.to_lowercase();

                // Check if this entry should be included in completions:
                // 1. Empty prefix means include everything from starting directory
                // 2. Name starts with prefix (traditional completion)
                // 3. Any part of path contains the prefix (fuzzy search)
                let matches_path = entry_path_str.contains(base_prefix_lower);
                let matches_name = name_lower.contains(base_prefix_lower);
                let should_include = base_prefix_lower.is_empty() || matches_name || matches_path;

                if should_include {
                    let completion_path = entry_path_relative.clone(); // Path relative to initial search

                    match entry.file_type() {
                         Ok(ft) => {
                            if ft.is_dir() {
                                // Add the directory itself to completions (with a slash)
                                completions.push(completion_path);
                            } else if ft.is_file() {
                                // Add the file
                                completions.push(completion_path);
                            }
                         }
                         Err(_) => { /* Ignore file type errors */ }
                    }
                }
                
                // Always recurse into directories, even if they don't match,
                // as they might contain matching files or subdirectories
                match entry.file_type() {
                    Ok(ft) => {
                        if ft.is_dir() {
                            let _ = find_completions_recursive(
                                &entry.path(),
                                base_prefix_lower,
                                &entry_path_relative,
                                completions,
                                max_depth - 1,
                            );
                        }
                    }
                    Err(_) => { /* Ignore file type errors */ }
                }
            }
        }
    }
    Ok(())
}

/// Finds potential path completions based on user input and current directory.
///
/// # Arguments
///
/// * `input` - The current text in the input bar.
/// * `cwd_str` - The current working directory as a string.
///
/// # Returns
///
/// A tuple containing:
/// - A vector of strings representing matching paths (relative to the input base).
/// - An optional `PathCompletionTarget` if a valid path-like segment was found.
/// Returns an empty vector and `None` if no relevant path fragment is found or on error.
pub fn get_completions<'a>(input: &'a str, cwd_str: &str) -> (Vec<String>, Option<PathCompletionTarget<'a>>) {
    let cwd = Path::new(cwd_str);
    let target = match parse_input_for_completion(input, cwd) {
        Some(t) => t,
        None => return (vec![], None), // No path-like segment found
    };

    let mut raw_completions = Vec::new();
    let prefix_lower = target.prefix.to_lowercase();
    let max_depth = 10; // Increased recursion depth for better deep directory search

    // Start recursive search from the absolute search_dir identified by parse_input
    // Pass an empty initial relative path
    let _ = find_completions_recursive(
        &target.search_dir,
        &prefix_lower,
        Path::new(""),
        &mut raw_completions,
        max_depth,
    );

    // Convert relative paths (from search_dir) to full paths relative to CWD fragment base
    // and add trailing slash to directories.
    let mut final_completions = Vec::new();
    for rel_path in raw_completions {
        let full_path_abs = target.search_dir.join(&rel_path);
        let mut completion_str = target.base_dir_str.to_string(); // Start with base like "src/"
        completion_str.push_str(&rel_path.to_string_lossy());

        // Add trailing slash if it's a directory
        if full_path_abs.is_dir() {
             completion_str.push('/');
        }

        final_completions.push(completion_str);
    }

    // Deduplicate before sorting - some paths might show up multiple times
    // due to the more aggressive recursive search
    final_completions.sort();
    final_completions.dedup();

    // Now sort with directories first
    final_completions.sort_by(|a, b| {
        let a_is_dir = a.ends_with('/');
        let b_is_dir = b.ends_with('/');
        // Sort directories first, then files, then alphabetically
        b_is_dir.cmp(&a_is_dir).then_with(|| a.cmp(b))
    });

    // Limit results to a reasonable number to avoid overwhelming the UI
    let max_completions = 100;
    if final_completions.len() > max_completions {
        final_completions.truncate(max_completions);
    }

    (final_completions, Some(target))
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    // Helper to create nested structure
    fn setup_test_dir() -> tempfile::TempDir {
        let dir = tempdir().unwrap();
        let cwd = dir.path();
        fs::write(cwd.join("README.md"), "readme").unwrap();
        fs::write(cwd.join("LICENSE"), "license").unwrap();
        let src_dir = cwd.join("src");
        fs::create_dir(&src_dir).unwrap();
        fs::write(src_dir.join("main.rs"), "main").unwrap();
        fs::write(src_dir.join("lib.rs"), "lib").unwrap();
        let sub_dir = src_dir.join("subdir");
        fs::create_dir(&sub_dir).unwrap();
        fs::write(sub_dir.join("deep_file.txt"), "deep").unwrap();
        fs::write(cwd.join(".hiddenfile"), "hidden").unwrap();
        fs::create_dir(cwd.join(".hiddendir")).unwrap();
        fs::write(cwd.join(".hiddendir").join("inside.txt"), "inside").unwrap();
        dir
    }

    #[test]
    fn test_parse_input_simple_prefix() {
        let dir = setup_test_dir();
        let cwd = dir.path();
        let target = parse_input_for_completion("summarize RE", cwd).unwrap();
        assert_eq!(target.fragment, "RE");
        assert_eq!(target.base_dir_str, "");
        assert_eq!(target.prefix, "RE");
        assert_eq!(target.search_dir, cwd.canonicalize().unwrap());
        assert_eq!(target.fragment_start_index, "summarize ".len());

    }

    #[test]
    fn test_parse_input_with_dir() {
        let dir = setup_test_dir();
        let cwd = dir.path();
        let target = parse_input_for_completion("edit src/ma", cwd).unwrap();
        assert_eq!(target.fragment, "src/ma");
        assert_eq!(target.base_dir_str, "src/");
        assert_eq!(target.prefix, "ma");
        assert_eq!(target.search_dir, cwd.join("src").canonicalize().unwrap());
        assert_eq!(target.fragment_start_index, "edit ".len());
    }

     #[test]
    fn test_parse_input_with_dir_trailing_slash() {
        let dir = setup_test_dir();
        let cwd = dir.path();
        let target = parse_input_for_completion("ls src/", cwd).unwrap();
        assert_eq!(target.fragment, "src/");
        assert_eq!(target.base_dir_str, "src/");
        assert_eq!(target.prefix, "");
        assert_eq!(target.search_dir, cwd.join("src").canonicalize().unwrap());
         assert_eq!(target.fragment_start_index, "ls ".len());
    }

    #[test]
    fn test_parse_input_no_path_like_fragment() {
        let dir = setup_test_dir();
        let cwd = dir.path();
        // Only trigger if it looks like a path (contains / or starts with .)
        assert!(parse_input_for_completion("just some words", cwd).is_none());
        // Should parse if it starts with ./ even without space
        assert!(parse_input_for_completion("./somefile", cwd).is_some());
    }

    // --- Updated get_completions tests ---

    #[test]
    fn test_get_completions_basic_recursive() {
        let dir = setup_test_dir();
        let cwd_str = dir.path().to_str().unwrap();

        // Complete from root
        let (completions, _) = get_completions("L", cwd_str);
        assert_eq!(completions, vec!["LICENSE"]);

        let (completions, _) = get_completions("R", cwd_str);
        assert_eq!(completions, vec!["README.md"]);

        // Complete directory and file inside
        let (completions, _) = get_completions("s", cwd_str);
        assert_eq!(completions, vec!["src/", "src/lib.rs", "src/main.rs", "src/subdir/", "src/subdir/deep_file.txt"]); // Recursive

        // Complete starting with full path
        let (completions, _) = get_completions("src/m", cwd_str);
        assert_eq!(completions, vec!["src/main.rs"]);

        // Complete deeper path
        let (completions, _) = get_completions("src/sub", cwd_str);
        assert_eq!(completions, vec!["src/subdir/", "src/subdir/deep_file.txt"]);

        // Complete file in deep path
        let (completions, _) = get_completions("src/subdir/d", cwd_str);
        assert_eq!(completions, vec!["src/subdir/deep_file.txt"]);

        // Test flexible search (no path structure)
        // This is the key new functionality - finds matches anywhere in the directory tree
        let (completions, _) = get_completions("deep", cwd_str);
        assert_eq!(completions, vec!["src/subdir/deep_file.txt"]);
        
        let (completions, _) = get_completions("lib", cwd_str);
        assert_eq!(completions, vec!["src/lib.rs"]);

        // Empty input -> complete from CWD
        let (completions, _) = get_completions("", cwd_str);
        assert_eq!(completions, vec!["src/", "LICENSE", "README.md"]); // Only top level for empty

        // Trailing space -> complete from CWD
        let (completions, _) = get_completions("cd ", cwd_str);
        assert_eq!(completions, vec!["src/", "LICENSE", "README.md"]);
    }

    #[test]
    fn test_get_completions_case_insensitive() {
         let dir = setup_test_dir();
        let cwd_str = dir.path().to_str().unwrap();

        let (completions, _) = get_completions("l", cwd_str);
        assert_eq!(completions, vec!["LICENSE", "src/lib.rs"]);

        let (completions, _) = get_completions("readme", cwd_str);
        assert_eq!(completions, vec!["README.md"]);

        let (completions, _) = get_completions("Src/L", cwd_str);
        assert_eq!(completions, vec!["src/lib.rs"]);
    }

    #[test]
    fn test_get_completions_hidden_files_recursive() {
        let dir = setup_test_dir();
        let cwd_str = dir.path().to_str().unwrap();

        // Should not show hidden files when prefix is empty
        let (completions, _) = get_completions("", cwd_str);
        assert!(!completions.iter().any(|c| c.starts_with('.')));
        assert_eq!(completions, vec!["src/", "LICENSE", "README.md"]);

        // Should show hidden files/dirs if prefix starts with "."
        let (completions, _) = get_completions(".", cwd_str);
        // Note: recursive search might find things inside .hiddendir too if depth allows
        assert_eq!(completions, vec![".hiddendir/", ".hiddendir/inside.txt", ".hiddenfile"]);

         // Should show content inside hidden dir if specified
        let (completions, _) = get_completions(".hiddendir/", cwd_str);
        assert_eq!(completions, vec![".hiddendir/inside.txt"]);
    }

    #[test]
    fn test_get_completions_no_match_recursive() {
        let dir = setup_test_dir();
        let cwd_str = dir.path().to_str().unwrap();
        let (completions, _) = get_completions("nonexistent", cwd_str);
        assert!(completions.is_empty());

        let (completions, _) = get_completions("src/nonexistent", cwd_str);
        assert!(completions.is_empty());
    }

    #[test]
    fn test_get_completions_invalid_base_dir() {
         let dir = setup_test_dir();
        let cwd_str = dir.path().to_str().unwrap();
        let (completions, target) = get_completions("invalid_dir/file", cwd_str);
        assert!(completions.is_empty());
        assert!(target.is_none()); // parse should fail if base dir is invalid
    }
}
