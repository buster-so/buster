# CLAUDE.md

This file provides guidance to Claude Code when working with code in this monorepo.

**Note**: Many packages and apps have their own CLAUDE.md files with specific implementation details and patterns. Always check for a local CLAUDE.md when working in a specific directory.

## Key Agent Workflow
1. **Planning**: Always start with the `monorepo-task-planner` agent for new tasks or requirement changes
2. **Implementation**: Follow the plan in `.claude/tasks/`, updating status as you work
3. **Quality Assurance**: Use the `qa-test-engineer` agent for comprehensive testing before completion
4. **Focus on**: Type safety (`turbo build:dry-run`), linting (`turbo lint`), and modular code design

## Monorepo Structure

This is a pnpm-based monorepo using Turborepo with the following structure:

### Apps (`@buster-app/*`)
- `apps/web` - Next.js frontend application
- `apps/server` - Node.js/Hono backend server  
- `apps/trigger` - Background job processing with Trigger.dev v3
- `apps/electric-server` - Electric SQL sync server
- `apps/api` - Rust backend API (legacy)
- `apps/cli` - Command-line tools (Rust)

### Packages (`@buster/*`)
- `packages/ai` - AI agents, tools, and workflows using Mastra framework
- `packages/database` - Database schema, migrations, and utilities (Drizzle ORM)
- `packages/data-source` - Data source adapters (PostgreSQL, MySQL, BigQuery, Snowflake, etc.)
- `packages/access-controls` - Permission and access control logic
- `packages/stored-values` - Stored values management
- `packages/rerank` - Document reranking functionality
- `packages/server-shared` - Shared server types and utilities
- `packages/test-utils` - Shared testing utilities
- `packages/vitest-config` - Shared Vitest configuration
- `packages/typescript-config` - Shared TypeScript configuration
- `packages/web-tools` - Web scraping and research tools
- `packages/slack` - Standalone Slack integration (OAuth, messaging, channels)
- `packages/supabase` - Supabase setup and configuration
- `packages/sandbox` - Sandboxed code execution using Daytona SDK

## Agent-Based Workflow

### Planning with monorepo-task-planner
- **Always use the monorepo-task-planner agent first** when starting any new task, feature, or when requirements change
- The planner will create detailed implementation plans and write them to `.claude/tasks/TASK_NAME.md`
- **Reference and update task files**: Frequently check the task files created by the planner and update the status of items and specs as you work
- Update task files with detailed descriptions of changes made so work can be easily handed over

### Testing with qa-test-engineer
- **Use the qa-test-engineer agent** after completing implementation work to ensure proper test coverage
- The QA engineer will run tests, analyze coverage, and ensure code quality
- Every completed task goes through QA review, so focus on writing modular, testable code

### Development Best Practices
- **Follow test-driven development**: 
  - Stub out tests and assertions first
  - Build your functions to meet those tests
  - Run `turbo test:unit` to verify your implementation works
  - If struggling with tests after completing functional code, pass to qa-test-engineer
- **Run quality checks while working**: Periodically run `turbo build:dry-run` and `turbo lint` to catch issues early
- **Your primary job is the functional implementation**: Focus on accomplishing the task; the QA engineer specializes in comprehensive testing

## Development Workflow

When writing code, follow this workflow to ensure code quality:

### 1. Write Modular, Testable Functions
- Create small, focused functions with single responsibilities
- Design functions to be easily testable with clear inputs/outputs
- Use dependency injection for external dependencies
- **IMPORTANT: Write functional, composable code - avoid classes**
- All features should be composed of testable functions
- Follow existing patterns in the codebase

### 2. Build Features by Composing Functions
- Combine modular functions to create complete features
- Keep business logic separate from infrastructure concerns
- Use proper error handling at each level

## Environment Variables

This project uses a centralized environment variable system:

1. **All environment variables are defined at the root level** in a single `.env` file
2. **Turbo passes these variables** to all packages via the `globalEnv` configuration in `turbo.json`
3. **Individual packages validate** their required environment variables using the shared `@buster/env-utils` package

### Setting Up Environment Variables

1. Copy `.env.example` to `.env` at the project root:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values in `.env`

3. All packages will automatically have access to these variables through Turbo

### Adding New Environment Variables

When adding new environment variables:

1. Add the variable to `.env.example` with a descriptive comment
2. Add the variable name to the `globalEnv` array in `turbo.json`
3. Update the package's `validate-env.js` script to include the new variable
4. Update the package's `env.d.ts` file with the TypeScript type definition

### Migrating Packages to Centralized Env

To migrate an existing package to use the centralized environment system:

1. Remove any local `.env` files from the package
2. Add `@buster/env-utils` as a dependency:
   ```json
   "@buster/env-utils": "workspace:*"
   ```
3. Update the package's `scripts/validate-env.js` to use the shared utilities:
   ```javascript
   import { loadRootEnv, validateEnv } from '@buster/env-utils';
   
   loadRootEnv();
   
   const requiredEnv = {
     DATABASE_URL: process.env.DATABASE_URL,
     // ... other required variables
   };
   
   const { hasErrors } = validateEnv(requiredEnv);
   if (hasErrors) process.exit(1);
   ```

### 3. Ensure Type Safety
```bash
# Build entire monorepo to check types
turbo run build

# Build specific package/app
turbo run build --filter=@buster/ai
turbo run build --filter=@buster-app/web

# Type check without building
turbo run typecheck
turbo run typecheck --filter=@buster/database
```

### 4. Run Biome for Linting & Formatting
```bash
# Check files with Biome
pnpm run check path/to/file.ts
pnpm run check packages/ai

# Auto-fix linting, formatting, and import organization
pnpm run check:fix path/to/file.ts
pnpm run check:fix packages/ai
```

### 5. Run Tests with Vitest

**Important**: Always run unit tests before completing any task to ensure code changes don't break existing functionality.

```bash
# Run unit tests (always run these when working locally)
turbo run test:unit

# Run unit tests for specific package
turbo run test:unit --filter=@buster/ai

# Run integration tests ONLY for specific features/packages you're working on
turbo run test:integration --filter=@buster/database

# Run specific test file
pnpm run test path/to/file.test.ts

# Watch mode for development
pnpm run test:watch
```

### 6. Pre-Completion Checklist
**IMPORTANT: Before finishing any task:**
```bash
# Run build and lint checks during development
turbo run build:dry-run lint

# Run unit tests to verify your implementation
turbo run test:unit

# The qa-test-engineer agent will handle comprehensive testing and coverage
```

**Key Guidelines:**
- **Focus on type safety and linting** during development
- **Write modular, testable code** following functional patterns
- **Run unit tests** to verify your implementation works
- **The qa-test-engineer agent** will ensure comprehensive test coverage
- **Update task status** in `.claude/tasks/` files as you complete work
- **Document changes** in task files for handover

## Code Quality Standards

### TypeScript Configuration
- **Strict mode enabled** - All strict checks are on
- **No implicit any** - Always use specific types
- **Strict null checks** - Handle null/undefined explicitly
- **No implicit returns** - All code paths must return
- **Consistent file casing** - Enforced by TypeScript

### Type Safety and Zod Best Practices
- We care deeply about type safety and we use Zod schemas and then export them as types
- We prefer using type abstractions over `.parse()` method calls
- Always export Zod schemas as TypeScript types to leverage static type checking
- Avoid runtime type checking when compile-time type checks are sufficient

### Biome Rules (Key Enforcements)
- **`useImportType: "warn"`** - Use type-only imports when possible
- **`noExplicitAny: "error"`** - Never use `any` type
- **`noUnusedVariables: "error"`** - Remove unused code
- **`noNonNullAssertion: "error"`** - No `!` assertions
- **`noConsoleLog: "warn"`** - Avoid console.log in production
- **`useNodejsImportProtocol: "error"`** - Use `node:` prefix for Node.js imports

### Logging Guidelines
- **Never use `console.log`**
- **Use appropriate console methods**:
  - `console.info` for general information
  - `console.warn` for warning messages
  - `console.error` for error messages

## Error Handling and Logging Philosophy
- We care deeply about error handling and logging
- Key principles for error management:
  - Catch errors effectively and thoughtfully
  - Consider the state errors put the system into
  - Implement comprehensive unit tests for error scenarios
  - Log errors strategically for effective debugging
  - Avoid over-logging while ensuring sufficient context for troubleshooting

## Hono API Development Guidelines

### API Structure and Organization
- **Version-based organization** - APIs are organized under `/api/v2/` directory
- **Feature-based folders** - Each feature gets its own folder (e.g., `chats/`, `security/`)
- **Separate handler files** - Each endpoint handler must be in its own file
- **Functional handlers** - All handlers should be pure functions that accept request data and return response data

### Request/Response Type Safety
- **Use shared types** - All request and response types must be defined in `@buster/server-shared`
- **Zod schemas** - Define schemas in server-shared and export both the schema and inferred types
- **zValidator middleware** - Always use `zValidator` from `@hono/zod-validator` for request validation
- **Type imports** - Import types from server-shared packages for consistency

### Handler Pattern
```typescript
// Handler file (e.g., get-workspace-settings.ts)
import type { GetWorkspaceSettingsResponse } from '@buster/server-shared/security';
import type { User } from '@buster/database';

export async function getWorkspaceSettingsHandler(
  user: User
): Promise<GetWorkspaceSettingsResponse> {
  // Implementation
}

// Route definition (index.ts)
.get('/workspace-settings', async (c) => {
  const user = c.get('busterUser');
  const response = await getWorkspaceSettingsHandler(user);
  return c.json(response);
})
```

### Authentication and User Context
- **Use requireAuth middleware** - Apply to all protected routes
- **Extract user context** - Use `c.get('busterUser')` to get the authenticated user
- **Type as User** - Import `User` type from `@buster/database` for handler parameters

## Database Operations

### Query Organization
- **All database queries must be created as helper functions** in `@packages/database/src/queries/`
- **Organize by table** - Each table should have its own subdirectory (e.g., `assets/`, `chats/`, `users/`)
- **Type all queries** - Every query function must have properly typed parameters and return types
- **Export from index** - Each subdirectory should have an `index.ts` that exports all queries for that table
- **Reusable and composable** - Write queries as small, focused functions that can be composed together

### Soft Delete and Upsert Practices
- In our database, we never hard delete, we always use soft deletes with the `deleted_at` field
- For update operations, we should almost always perform an upsert unless otherwise specified

## Test Running Guidelines
- When running tests, use the following Turbo commands:
  - `turbo test:unit` for unit tests
  - `turbo test:integration` for integration tests
  - `turbo test` for running all tests

## Pre-Completion Workflow
- Run `turbo build:dry-run lint` during development to ensure type safety and code quality
- The qa-test-engineer agent will handle comprehensive testing before PRs
- Update task status and documentation in `.claude/tasks/` files
- Coordinate with the monorepo-task-planner for any requirement changes

## Local Development

### Local Development Details
- The local dev app is typically running at localhost:3000
- To get the app up and running you need to run turbo dev from root
```