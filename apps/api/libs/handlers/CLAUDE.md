# Handlers Library - Agent Guidance

## Purpose & Role

The Handlers library implements the request handlers for the Buster API, processing incoming HTTP requests, performing business logic, and returning appropriate responses. It acts as the controller layer in the application architecture, orchestrating interactions between other libraries.

## Key Functionality

- REST API endpoint handlers for all resources
- Request validation and authentication
- Response formatting and error handling
- Business logic implementation
- Resource management (chats, collections, dashboards, metrics, etc.)
- Sharing and permission management

## Internal Organization

### Directory Structure

```
src/
  ├── chats/ - Chat and thread handlers
  │   ├── context_loaders/ - Context loading for chats
  │   ├── helpers/ - Chat utility functions
  │   ├── sharing/ - Chat sharing functionality
  │   ├── streaming_parser.rs - Streaming response parsing
  │   ├── types.rs - Chat-specific types
  │   └── mod.rs
  ├── collections/ - Collection management
  │   ├── sharing/ - Collection sharing
  │   ├── types.rs - Collection-specific types
  │   └── mod.rs
  ├── dashboards/ - Dashboard management
  │   ├── sharing/ - Dashboard sharing
  │   ├── types.rs - Dashboard-specific types
  │   └── mod.rs
  ├── data_sources/ - Data source handlers
  ├── favorites/ - User favorites
  ├── logs/ - Log handling
  ├── messages/ - Message management
  │   ├── types/ - Message-related types
  │   └── helpers/ - Message utility functions
  ├── metrics/ - Metrics management
  │   ├── sharing/ - Metrics sharing
  │   ├── types.rs - Metrics-specific types
  │   └── mod.rs
  ├── utils/ - Shared utilities
  │   └── user/ - User-related utilities
  └── lib.rs - Public exports
```

### Key Modules

- `chats`: Handles chat and thread operations (create, update, delete, list)
- `collections`: Manages collections of assets (create, add/remove assets, share)
- `dashboards`: Handles dashboard operations and associations
- `data_sources`: Manages data source connections and configurations
- `favorites`: Handles user favorite assets and resources
- `messages`: Manages individual messages within threads
- `metrics`: Handles metric operations and associations
- `utils`: Shared utility functions used across handlers

## Usage Patterns

```rust
use handlers::chats::post_chat_handler;
use handlers::thread_types::PostChatRequest;

async fn example_handler(req: PostChatRequest, user: AuthenticatedUser) -> Result<Json<Response>, Error> {
    // Call the appropriate handler
    let response = post_chat_handler(req, user, pool).await?;
    
    // Return the response
    Ok(Json(response))
}
```

### Common Implementation Patterns

- Each handler follows a consistent pattern for request processing
- Authentication and permission checks are performed at the beginning
- Database operations are isolated and use the connection pool
- Errors are mapped to appropriate HTTP responses
- Responses are structured according to API specifications
- Sharing handlers follow a consistent pattern across resource types
- Context loaders are used to fetch related data for complex operations

## Dependencies

- **Internal Dependencies**:
  - `database`: For data persistence and retrieval
  - `agents`: For agent-based processing
  - `litellm`: For LLM interactions
  - `query_engine`: For executing queries against data sources
  - `middleware`: For authentication and request processing
  - `sharing`: For permission and sharing functionality

- **External Dependencies**:
  - `diesel` and `diesel-async`: For database operations
  - `serde` and `serde_json`: For serialization/deserialization
  - `uuid`: For unique identifier handling
  - `chrono`: For date/time operations
  - `anyhow`: For error handling

## Code Navigation Tips

- Start with `lib.rs` to see all exported modules
- Each module in the top level represents a resource type (chats, collections, etc.)
- Handler files are named after their operation (e.g., `create_dashboard_handler.rs`)
- Type definitions for requests and responses are in `types.rs` files
- Sharing functionality is consistently implemented in `sharing/` submodules
- Helper functions are organized in `helpers/` submodules
- Look for common patterns across similar handlers

## Testing Guidelines

- Mock dependencies (database, agents, etc.) for unit tests
- Test error handling and edge cases
- Verify permissions and access controls
- Test the full request-response cycle for integration tests
- Use test fixtures for consistent test data
- Run tests with: `cargo test -p handlers`
- Create tests for each handler in the corresponding `tests/` directory

### Automatic Test Environment Setup and Best Practices

Integration tests in this library benefit from an automatic database pool initialization system configured in `tests/mod.rs`. This setup uses `lazy_static` and `ctor` to initialize database pools (Postgres, Redis) once when the test module loads, meaning individual tests **do not** need to perform pool initialization.

**Best Practice:** While you *can* directly use `get_pg_pool()` etc., it is **strongly recommended** to use the `TestSetup` or `TestDb` utilities from the `database` library's test commons (`database::tests::common::db`) for structuring your tests:

1.  **Consistent Setup:** `TestSetup` provides a standard starting point with a pre-created test user, organization, and a `TestDb` instance. Use `TestDb` directly if you need more control over the initial setup.
2.  **Helper Methods:** `TestDb` offers convenient methods for obtaining connections (`diesel_conn`, `sqlx_conn`, `redis_conn`) and creating common test entities (users, orgs, relationships) linked to the test instance.
3.  **Crucial Cleanup:** `TestDb` includes a vital `cleanup()` method that removes data created during the test, ensuring test isolation. **This cleanup method MUST be called at the end of every test.**

**Example Test Structure:**

```rust
use anyhow::Result;
// Adjust import path based on actual visibility/re-exports
use database::tests::common::db::{TestSetup, TestDb};
use database::enums::UserOrganizationRole;

#[tokio::test]
async fn test_handler_with_setup() -> Result<()> {
    // 1. Initialize test environment using TestSetup
    //    This gives a user, org, and db instance.
    let setup = TestSetup::new(Some(UserOrganizationRole::Member)).await?;

    // 2. Get connections via the db instance
    let mut conn = setup.db.diesel_conn().await?;

    // 3. Use setup data (setup.user, setup.organization) and helpers (setup.db.create_...)
    //    Perform test logic...
    //    assert!(...)

    // 4. !!! Crucially, cleanup test data !!!
    setup.db.cleanup().await?;

    Ok(())
}

#[tokio::test]
async fn test_handler_with_direct_db() -> Result<()> {
    // Alternative: Use TestDb directly if no initial user/org needed
    let db = TestDb::new().await?;
    let mut conn = db.diesel_conn().await?;

    // Perform test logic...

    // !!! Crucially, cleanup test data !!!
    db.cleanup().await?;
    Ok(())
}
```

To add new test modules, simply:
1. Create a new module in the `tests/` directory
2. Add it to the module declarations in `tests/mod.rs`
3. Write standard async tests using `#[tokio::test]` following the `TestSetup`/`TestDb` pattern above.