# Sharing Library - Agent Guidance

## Purpose & Role

The Sharing library provides functionality for managing asset permissions and sharing resources with users and teams in Buster. It implements the core sharing model, handling permission checks, creation, listing, and removal of access rights across all asset types.

## Key Functionality

- Permission checking for asset access
- Creation of sharing permissions
- Listing existing permissions on assets
- Removal of sharing permissions
- User lookup by email for sharing
- Error handling specific to sharing operations

## Internal Organization

### Directory Structure

```
src/
  ├── check_asset_permission.rs - Permission verification
  ├── create_asset_permission.rs - Creating new permissions
  ├── errors.rs - Sharing-specific error types
  ├── list_asset_permissions.rs - Listing existing permissions
  ├── remove_asset_permissions.rs - Removing permissions
  ├── types.rs - Sharing-related type definitions
  ├── user_lookup.rs - Finding users for sharing
  ├── tests/ - Test modules
  │   ├── check_asset_permission_test.rs
  │   └── mod.rs
  └── lib.rs - Public exports and documentation
```

### Key Modules

- `check_asset_permission`: Functions for verifying if a user has access to assets
- `create_asset_permission`: Functions for granting access to assets
- `list_asset_permissions`: Functions for listing existing permissions
- `remove_asset_permissions`: Functions for revoking access to assets
- `user_lookup`: Functions for finding users by email for sharing
- `types`: Data structures for sharing operations
- `errors`: Error types specific to sharing operations

## Usage Patterns

```rust
use sharing::{check_access, create_share_by_email, list_shares, remove_share_by_email};
use sharing::types::{AssetType, Permission};
use uuid::Uuid;

async fn example_sharing_operations(pool: &DbPool) -> Result<(), anyhow::Error> {
    let asset_id = Uuid::new_v4();
    let asset_type = AssetType::Dashboard;
    let user_email = "user@example.com";
    
    // Create a new share
    create_share_by_email(
        pool,
        asset_id,
        asset_type,
        user_email,
        Permission::View,
        None, // organization_id (if applicable)
    ).await?;
    
    // Check if user has access
    let has_access = check_access(
        pool,
        asset_id,
        asset_type,
        Some(user_id), // User ID to check
        Permission::View,
    ).await?;
    
    // List all shares for an asset
    let shares = list_shares(
        pool,
        asset_id,
        asset_type,
        None, // organization_id (if applicable)
    ).await?;
    
    // Remove a share
    remove_share_by_email(
        pool,
        asset_id,
        asset_type,
        user_email,
    ).await?;
    
    Ok(())
}
```

### Common Implementation Patterns

- Always check permissions before allowing access to restricted operations
- Handle not-found errors appropriately when users don't exist
- Use bulk operations when dealing with multiple assets or users
- Verify organization context for multi-tenant operations
- Use appropriate permission levels (View, Edit, Admin) based on operation

## Dependencies

- **Internal Dependencies**:
  - `database`: For storing and retrieving permission records

- **External Dependencies**:
  - `diesel` and `diesel-async`: For database operations
  - `uuid`: For working with unique identifiers
  - `thiserror`: For error handling
  - `chrono`: For timestamp handling
  - `serde`: For serialization of sharing data

## Code Navigation Tips

- Start with `lib.rs` to see the exported functions
- Key operations are in separate modules with descriptive names
- `check_asset_permission.rs` contains the core permission checking logic
- `types.rs` defines the sharing model data structures
- Error handling is centralized in `errors.rs`
- Database queries are typically implemented in the module corresponding to their operation

## Testing Guidelines

- Test permission checks with various access levels
- Verify that permissions are correctly created, listed, and removed
- Test error cases like sharing with non-existent users
- Use test fixtures for consistent test data
- Run tests with: `cargo test -p sharing`
- Check test coverage for critical permission checks