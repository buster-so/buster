use thiserror::Error;

#[derive(Error, Debug)]
pub enum SqlAnalyzerError {
    #[error("SQL parsing failed: {0}")]
    ParseError(String),

    #[error("Vague references detected:\n{0}")]
    VagueReferences(String),

    #[error("Semantic layer validation error: {0}")]
    SemanticValidation(String),

    #[error("Unknown metric: {0}")]
    UnknownMetric(String),

    #[error("Unknown filter: {0}")]
    UnknownFilter(String),

    #[error("Invalid table join: {0}")]
    InvalidJoin(String),

    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),

    #[error("Missing required parameter: {0}")]
    MissingParameter(String),

    #[error("Invalid expression: {0}")]
    InvalidExpression(String),

    #[error("Substitution error: {0}")]
    SubstitutionError(String),

    #[error("Unsupported statement type found: {0}")]
    UnsupportedStatement(String),

    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl From<sqlparser::parser::ParserError> for SqlAnalyzerError {
    fn from(err: sqlparser::parser::ParserError) -> Self {
        SqlAnalyzerError::ParseError(err.to_string())
    }
}