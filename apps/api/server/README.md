# Buster Server

This directory contains the main server code for the Buster API. It provides the API endpoints, WebSocket handlers, and application logic for the Buster application.

## Structure

- `src/` - Main server code
  - `routes/` - API endpoints (REST, WebSocket)
  - `utils/` - Shared utilities
  - `types/` - Common type definitions

## Development

To run the server in development mode:

```bash
# From the project root
make dev

# Or to run with faster feedback loop
make fast
```

## Dependencies

The server depends on the following local libraries:

- `database` - Database access and models
- `handlers` - Business logic handlers
- `middleware` - HTTP middleware components
- `query_engine` - SQL query engine
- `sharing` - Asset sharing functionality
- `search` - Search functionality

All dependencies are inherited from the workspace Cargo.toml. 