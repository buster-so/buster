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

    pub fn log_excluded_file_impl(&mut self, path: &str, pattern: &str) {
        self.excluded_files += 1;
        println!("⛔ Excluding file: {} (matched pattern: {})", path, pattern);
    }

    pub fn log_excluded_tag_impl(&mut self, path: &str, tag: &str) {
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
       self.log_excluded_file_impl(path, pattern);
    }

    fn log_excluded_tag(&mut self, path: &str, tag: &str) {
       self.log_excluded_tag_impl(path, tag);
    }
} 