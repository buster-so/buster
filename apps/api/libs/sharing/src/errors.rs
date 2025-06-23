use thiserror::Error;

#[derive(Error, Debug)]
pub enum SharingError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] diesel::result::Error),

    #[error("User not found: {0}")]
    UserNotFound(String),
    
    #[error("Invalid permission role: {0}")]
    InvalidPermissionRole(String),
    
    #[error("Deprecated asset type: {0}")]
    DeprecatedAssetType(String),
    
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    
    #[error("Invalid email address: {0}")]
    InvalidEmail(String),

    #[error("Asset not found: {0}")]
    AssetNotFound(String),
    
    #[error("Permission not found for asset {0}")]
    PermissionNotFound(String),

    #[error("Insufficient permissions to perform this action")]
    InsufficientPermissions,
    
    #[error("Internal error: {0}")]
    InternalError(String),
    
    #[error("Unknown error: {0}")]
    Unknown(String),
}