# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript
- `npm run clean` - Clean build artifacts

### Testing
- `npm test` - Run all tests (unit and integration)
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests (requires database connections)
- `npm run test:coverage` - Run tests with coverage report
- Run a single test file: `npm test -- tests/unit/adapters/factory.test.ts`

### Code Quality
- `npm run lint` - Run ESLint for code quality checks

## Architecture

This package provides a unified abstraction layer for connecting to and introspecting multiple database types. Key architectural patterns:

### Core Components

1. **DataSource Class** (`src/data-source.ts`)
   - Main entry point that manages multiple database adapters
   - Routes queries to specific data sources
   - Provides unified introspection interface
   - Backward compatible as `QueryRouter`

2. **Adapter Pattern** (`src/adapters/`)
   - Each database type implements `DatabaseAdapter` interface
   - Adapters handle connection, query execution, and lifecycle
   - Created via factory pattern using `createAdapter()`

3. **Introspection Layer** (`src/introspection/`)
   - Separate introspectors implement `DataSourceIntrospector` interface
   - Provides database structure discovery (databases, schemas, tables, columns)
   - Supports column statistics and table metadata
   - Scoped introspection allows filtering by database/schema/table

### Key Design Decisions

1. **Type Safety**: Extensive TypeScript interfaces and type guards for all database operations
2. **Separation of Concerns**: Query execution and introspection are separate interfaces
3. **Factory Pattern**: Credentials determine which adapter implementation to instantiate
4. **Connection Pooling**: Each adapter manages its own connection lifecycle
5. **Error Handling**: Unified error structure with detailed error information
6. **Smart Truncation**: Large text/JSON values in column statistics are intelligently truncated
7. **Batch Processing**: Column statistics fetched in batches of 20 tables for performance

### Testing Strategy

- **Unit Tests**: Test individual components in isolation (adapters, factory, types)
- **Integration Tests**: Test actual database connections (requires environment variables)
- **Test Configuration**: Uses Vitest with path aliasing (`@/` maps to `src/`)
- **Environment Variables**: Each database type has specific test environment variables (e.g., `TEST_POSTGRES_HOST`)

### Supported Databases

Full introspection support:
- Snowflake (with clustering information)
- PostgreSQL
- MySQL

Basic support (introspection placeholders):
- BigQuery
- SQL Server
- Redshift
- Databricks