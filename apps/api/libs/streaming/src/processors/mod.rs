//! Specialized processors for different types of streaming content

// Re-export all processors for easier access
mod create_dashboards_processor;
mod create_metrics_processor;
mod create_plan_processor;
mod search_data_catalog_processor;

pub use create_dashboards_processor::CreateDashboardsProcessor;
pub use create_metrics_processor::CreateMetricsProcessor;
pub use create_plan_processor::CreatePlanProcessor;
pub use search_data_catalog_processor::SearchDataCatalogProcessor;
