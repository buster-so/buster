use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BusterError {
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("File not found: {path}")]
    FileNotFound { path: PathBuf },
    #[error("Failed to parse file: {error}")]
    ParseError { error: String },
    #[error("Failed to write file: {path}")]
    FileWriteError { path: PathBuf, error: String },
    #[error("Command execution failed: {0}")]
    CommandError(String),
    #[error("Other: {0}")]
    Other(String),
}

// Add this near other error-related code
impl From<anyhow::Error> for BusterError {
    fn from(error: anyhow::Error) -> Self {
        BusterError::Other(error.to_string())
    }
}
