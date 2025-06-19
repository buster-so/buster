# Project Knowledge Base

## Core Architecture

```
Web Client
    ↓
API Layer (REST/WS/Auth)
    ↓
Handlers Layer (Metrics/Dashboards/Chats/Collections)
    ↓
Libraries Layer (Database/Agents/Sharing/Query Engine)
    ↓
External Services (Postgres/Redis/LLMs/Data Sources)
```

## Key Concepts

### Handlers
- Core business logic components used by REST/WS endpoints
- Located in `libs/handlers/src/[domain]/`
- Take individual parameters, not request objects
- Return `anyhow::Result<T>`
- Use structured logging with `tracing`

### Database
- Use `get_pg_pool().get().await?` for connections
- 5000 row limit by default on queries
- Test database uses `TestDb` infrastructure
- Clean up test data after each test

### Testing
```rust
// Basic pattern
let test_db = TestDb::new().await?;
// ... test code ...
test_db.cleanup().await?;

// With user setup (preferred)
let setup = TestSetup::new(Some(UserOrganizationRole::Admin)).await?;
// ... test code ...
setup.db.cleanup().await?;

// Create assets with permissions
let metric = AssetTestHelpers::create_test_metric_with_permission(
    &test_db, "Test Metric", user_id, AssetPermissionRole::Owner
).await?;
```

### Error Handling
- Use `anyhow::Result` for errors
- Provide descriptive error messages
- Log errors with context
- Never log secrets or sensitive data

### Permissions
- Check using `check_permission_access` from sharing library
- Permission roles: Owner, FullAccess, CanEdit, CanView
- Assets can be public with optional password protection
- Permissions can come from direct access or collection membership

## Common Commands

### Testing
```bash
# Run specific tests
cargo test -p [package_name]
cargo test [test_name]

# Debug output
cargo test -- --nocapture

# Enable SQL logging
TEST_LOG=debug cargo test -p database [test_name]
```

### Development
```bash
make dev    # Start development
make stop   # Stop development
cargo check
cargo clippy
cargo build
```

## Best Practices

1. **Code Style**
- Group imports (std, external, internal)
- Use structured logging
- Handle errors appropriately
- Write tests for new functionality
- Use snake_case for variables/functions, CamelCase for types

2. **Database**
- Use connection pool
- Handle transactions properly
- Clean up test data
- Respect row limits
- Never log sensitive data

3. **Testing**
- Use TestDb infrastructure
- Clean up after tests
- Test error cases
- Test permissions thoroughly
- Test with different user roles
- Use descriptive test asset names
- Isolate tests with unique test IDs

4. **Documentation**
- Keep domain-specific docs in CLAUDE.md files
- Document complex logic
- Include examples for reusable code
- Update CLAUDE.md files when adding patterns

## Library Relationships
- agents → litellm, database, braintrust
- handlers → database, agents, sharing
- query_engine → database
- All use common workspace dependencies

## Verification Protocol

After code changes:
1. Run `cargo check`
2. Run `cargo clippy`
3. Run relevant tests: `cargo test -p [package]`

## Troubleshooting

Common issues and solutions:
1. Test DB connection errors: Check DATABASE_URL in .env.test
2. Duplicate records: Ensure test_db.cleanup() is called
3. 403 errors: Check permission_access function usage
4. Tool failures: Verify ToolExecutor implementation