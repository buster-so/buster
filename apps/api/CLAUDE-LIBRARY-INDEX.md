# Buster API Library Reference Index

> **Last Updated**: April 7, 2025  
> **Version**: 1.0.0

This document serves as a centralized index of all major functionality across the Buster API libraries. Use it to quickly locate specific features and understand where they're implemented.

## Table of Contents
- [Database Library](#database-library)
- [Agents Library](#agents-library)
- [Handlers Library](#handlers-library)
- [Middleware Library](#middleware-library)
- [Sharing Library](#sharing-library)
- [LiteLLM Library](#litellm-library)
- [Query Engine Library](#query-engine-library)
- [SQL Analyzer Library](#sql-analyzer-library)
- [Streaming Library](#streaming-library)
- [Braintrust Library](#braintrust-library)

## Database Library

**Location**: `/api/libs/database`

**Core Functionality**:
- Database connection pooling - `pool.rs`
- Database models and schema - `models.rs`, `schema.rs`
- Enum definitions - `enums.rs`
- Secure credential vault - `vault.rs`

**Key Types**:
- `DbPool` - Database connection pool
- Table structs: `User`, `Organization`, `MetricFile`, `DashboardFile`, etc.
- Version history types - `version_history.rs`

**Common Operations**:
- Get database connection - `get_pg_pool().get().await?`
- Dashboard file operations - `helpers/dashboard_files.rs`
- Metric file operations - `helpers/metric_files.rs`
- Collection operations - `helpers/collections.rs`

## Agents Library

**Location**: `/api/libs/agents`

**Core Functionality**:
- Agent trait definition - `agent.rs`
- Agent implementations - `agents/buster_super_agent.rs`
- Tool execution framework - `tools/executor.rs`
- Tool categories - `tools/categories/`

**Key Types**:
- `Agent` trait - Core agent interface
- `BusterSuperAgent` - Main agent implementation
- `ToolExecutor` trait - Tool execution interface
- `ToolCallInfo` - Tool call metadata

**Common Operations**:
- Create and execute agents - `agent.rs`
- Register and execute tools - `tools/executor.rs`
- Use agents as tools - `tools/categories/agents_as_tools/`
- Create planning tools - `tools/categories/planning_tools/`

## Handlers Library

**Location**: `/api/libs/handlers`

**Core Functionality**:
- REST and WebSocket request handlers
- Business logic implementation
- Response formatting
- Permission checks

**Key Resource Types**:
- Metrics handlers - `metrics/`
- Dashboard handlers - `dashboards/`
- Chat handlers - `chats/`
- Collection handlers - `collections/`

**Common Operations**:
- Get dashboard by ID - `dashboards/get_dashboard_handler.rs`
- Get metric by ID - `metrics/get_metric_handler.rs`
- Create chat thread - `chats/post_thread.rs`
- List collections - `collections/list_collections.rs`

## Middleware Library

**Location**: `/api/libs/middleware`

**Core Functionality**:
- Authentication and authorization - `auth.rs`
- CORS configuration - `cors.rs`
- Error handling - `error.rs`
- Request and response types - `types.rs`

**Key Types**:
- `AuthenticatedUser` - User context
- `AppError` - API error types
- CORS configuration - `cors.rs`

**Common Operations**:
- Apply authentication middleware - `auth.rs`
- Extract authenticated user - `auth.rs`
- Configure CORS - `cors.rs`
- Format error responses - `error.rs`

## Sharing Library

**Location**: `/api/libs/sharing`

**Core Functionality**:
- Asset permission management
- Permission creation, listing, and removal
- User lookup for sharing

**Key Types**:
- `AssetPermissionRole` - Permission levels
- `AssetType` - Types of sharable assets
- `UpdateField` - Field updating helpers

**Common Operations**:
- Check permission access - `check_permission_access()`
- Create asset permission - `create_asset_permission.rs`
- List permissions - `list_asset_permissions.rs`
- Remove permissions - `remove_asset_permissions.rs`

## LiteLLM Library

**Location**: `/api/libs/litellm`

**Core Functionality**:
- LLM provider integration
- Message formatting
- Streaming response handling

**Key Types**:
- `LiteLLMClient` - Main client interface
- `Message` - LLM message format
- `Role` - Message roles (system, user, assistant)

**Common Operations**:
- Create LLM client - `client.rs`
- Generate completions - `client.rs`
- Handle streaming responses - `client.rs`

## Query Engine Library

**Location**: `/api/libs/query_engine`

**Core Functionality**:
- Data source connections
- Query execution
- Credential management
- Data type conversion

**Key Types**:
- Data source configurations
- Query results
- Credentials - `credentials.rs`
- Data types - `data_types.rs`

**Common Operations**:
- Execute queries - `data_source_query_routes/query_engine.rs`
- Connect to data sources - `data_source_connections/`
- Convert data types - `data_types.rs`

## SQL Analyzer Library

**Location**: `/api/libs/sql_analyzer`

**Core Functionality**:
- SQL query parsing and analysis
- Table and column extraction
- Join and CTE detection

**Key Types**:
- `QuerySummary` - Analysis output
- `TableInfo` - Table metadata
- `JoinInfo` - Join condition data
- `CteSummary` - CTE metadata

**Common Operations**:
- Analyze SQL query - `analyze_query()`
- Extract tables and columns
- Detect joins and CTEs
- Identify vague references

## Streaming Library

**Location**: `/api/libs/streaming`

**Core Functionality**:
- Streaming JSON parser - `parser.rs`
- Tool call processing - `processor.rs`
- Specialized processors - `processors/`

**Key Types**:
- `StreamingParser` - Main parser
- `Processor` trait - Tool call processor
- `ProcessorRegistry` - Processor collection
- `ProcessedOutput` - Parser output

**Common Operations**:
- Process JSON chunks - `parser.rs`
- Register processors - `processor.rs`
- Handle tool calls - `processor.rs`

## Braintrust Library

**Location**: `/api/libs/braintrust`

**Core Functionality**:
- Performance tracking for LLM operations
- Span and trace creation
- Event and metrics logging

**Key Types**:
- `BraintrustClient` - API client
- `TraceBuilder` - Trace creator
- `Span` - Execution span

**Common Operations**:
- Create client - `client.rs`
- Create traces - `trace.rs`
- Log spans - `client.rs`
- Track metrics - `client.rs`