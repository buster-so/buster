//! SQL Analyzer Library
//!
//! This library provides functionality to parse and analyze SQL queries,
//! extracting tables, columns, joins, and CTEs with lineage tracing.
//! It also includes semantic layer validation and substitution capabilities
//! to support querying with predefined metrics and filters.
//! Designed for integration with a Tokio-based web server.

mod errors;
pub mod types;
pub mod utils;

pub mod analysis;
pub mod semantic;
pub mod row_filtering;

pub use errors::SqlAnalyzerError;
pub use types::{
    QuerySummary, TableInfo, JoinInfo, CteSummary, 
    SemanticLayer, ValidationMode, Metric, Filter, 
    Parameter, ParameterType, Relationship
};

pub use analysis::analyze_query;
pub use semantic::{validate_semantic_query, substitute_semantic_query, validate_and_substitute_semantic_query};
pub use row_filtering::apply_row_level_filters;