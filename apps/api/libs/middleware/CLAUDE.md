# Middleware Library - Agent Guidance

## Purpose & Role

The Middleware library provides HTTP middleware components for the Buster API, handling cross-cutting concerns like authentication, authorization, and CORS. It serves as the security and request processing layer that runs before request handlers.

## Key Functionality

- Authentication middleware for validating user credentials
- User identity extraction and verification
- CORS (Cross-Origin Resource Sharing) configuration
- Request validation and preprocessing
- Structured types for authentication data

## Internal Organization

### Directory Structure

```
src/
  ├── auth.rs - Authentication middleware
  ├── cors.rs - CORS configuration
  ├── types.rs - Shared type definitions
  └── lib.rs - Public exports and documentation
```

### Key Modules

- `auth`: Implements authentication middleware for validating tokens and extracting user information
- `cors`: Configures CORS headers and policies for cross-origin requests
- `types`: Defines shared types used across middleware components

## Usage Patterns

```rust
use axum::{Router, routing::get};
use middleware::{auth, cors, types::AuthenticatedUser};

async fn create_router() -> Router {
    Router::new()
        .route("/protected", get(protected_handler))
        .layer(auth()) // Add authentication middleware
        .layer(cors()) // Add CORS middleware
}

async fn protected_handler(user: AuthenticatedUser) -> impl IntoResponse {
    // This handler only runs if authentication succeeds
    // The user parameter contains the authenticated user information
    format!("Hello, {}!", user.email)
}
```

### Common Implementation Patterns

- Apply middleware at the router level for global concerns
- Extract authenticated user information in handlers that require it
- Use organization and team membership for authorization checks
- Handle authentication errors with appropriate status codes
- Configure CORS for allowed origins and methods

## Dependencies

- **Internal Dependencies**:
  - `database`: For user lookup and validation

- **External Dependencies**:
  - `axum`: Web framework integration
  - `tower-http`: HTTP middleware components
  - `jsonwebtoken`: JWT validation and parsing
  - `serde`: Serialization and deserialization
  - `uuid`: For user and organization IDs

## Code Navigation Tips

- Start with `lib.rs` to see the exported functions and types
- `auth.rs` contains the authentication middleware implementation
- `cors.rs` contains the CORS configuration
- `types.rs` defines important types like `AuthenticatedUser`
- Look for the `auth()` function as the main entry point for authentication
- Understand the structure of `AuthenticatedUser` to see what information is available

## Testing Guidelines

- Test authentication with valid and invalid tokens
- Verify that protected routes reject unauthenticated requests
- Test CORS with different origin configurations
- Mock database responses for authentication tests
- Use test JWT tokens for authentication testing
- Run tests with: `cargo test -p middleware`
- Test integration with axum route handlers