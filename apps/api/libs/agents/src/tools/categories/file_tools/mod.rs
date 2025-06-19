pub mod common;
pub mod create_dashboards;
pub mod create_metrics;
pub mod file_types;
// pub mod filter_dashboards;
pub mod modify_dashboards;
pub mod modify_metrics;
pub mod search_data_catalog;

pub use create_dashboards::CreateDashboardFilesTool;
pub use create_metrics::CreateMetricFilesTool;
// pub use filter_dashboards::FilterDashboardsTool;
pub use modify_dashboards::ModifyDashboardFilesTool;
pub use modify_metrics::ModifyMetricFilesTool;
pub use search_data_catalog::SearchDataCatalogTool;

use crate::tools::ToolExecutor;

/// Trait to mark tools that should have line numbers added to their file content output
pub trait FileModificationTool: ToolExecutor {
    fn needs_line_numbers(&self) -> bool {
        true
    }
}

/// Adds line numbers to content in the format "line_number | content"
///
/// The padding for line numbers is calculated based on the total number of lines
/// to ensure consistent alignment throughout the file.
///
/// Example output:
/// ```text
///   1 | fn main() {
///   2 |     println!("Hello, world!");
///   3 | }
/// ```
pub fn add_line_numbers(content: &str) -> String {
    let lines: Vec<&str> = content.lines().collect();
    let total_lines = lines.len();
    let padding = total_lines.to_string().len();

    let mut result = String::with_capacity(content.len() + (padding + 3) * total_lines);

    for (i, line) in lines.into_iter().enumerate() {
        if i > 0 {
            result.push('\n');
        }
        result.push_str(&format!("{:>width$} | {}", i + 1, line, width = padding));
    }

    result
}
