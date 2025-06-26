# CLAUDE.md

This file provides guidance to Claude Code when working with code in this monorepo.

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

## Development Workflow

When writing code, follow this workflow to ensure code quality:

### 1. Write Modular, Testable Functions
- Create small, focused functions with single responsibilities
- Design functions to be easily testable with clear inputs/outputs
- Use dependency injection for external dependencies
- Follow existing patterns in the codebase

### 2. Build Features by Composing Functions
- Combine modular functions to create complete features
- Keep business logic separate from infrastructure concerns
- Use proper error handling at each level

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
```bash
# Run all tests
pnpm run test

# Run tests for specific package
turbo run test --filter=@buster/ai

# Run specific test file
pnpm run test path/to/file.test.ts

# Watch mode for development
pnpm run test:watch
```

## Code Quality Standards

### TypeScript Configuration
- **Strict mode enabled** - All strict checks are on
- **No implicit any** - Always use specific types
- **Strict null checks** - Handle null/undefined explicitly
- **No implicit returns** - All code paths must return
- **Consistent file casing** - Enforced by TypeScript

### Biome Rules (Key Enforcements)
- **`useImportType: "warn"`** - Use type-only imports when possible
- **`noExplicitAny: "error"`** - Never use `any` type
- **`noUnusedVariables: "error"`** - Remove unused code
- **`noNonNullAssertion: "error"`** - No `!` assertions
- **`noConsoleLog: "warn"`** - Avoid console.log in production
- **`useNodejsImportProtocol: "error"`** - Use `node:` prefix for Node.js imports

### Testing Practices

#### Test File Naming & Location
- **Unit tests**: `filename.test.ts` (alongside the source file)
- **Integration tests**: `filename.int.test.ts` (alongside the source file)
- Never separate tests into their own folders - keep them with the code they test

#### Testing Strategy
1. **Prioritize mocking** for unit tests after understanding API/DB structure
2. **Integration tests** should focus on single connection confirmations
3. **Mock external dependencies** appropriately
4. **Use descriptive test names** that explain the behavior
5. **Write tests alongside implementation** for better coverage

#### Example Test Structure
```typescript
// user-service.ts
export function getUserById(id: string) { /* ... */ }

// user-service.test.ts (same directory)
import { describe, it, expect, vi } from 'vitest';
import { getUserById } from './user-service';

describe('getUserById', () => {
  it('should return user when found', async () => {
    // Test implementation
  });
});

// user-service.int.test.ts (integration test)
import { describe, it, expect } from 'vitest';
import { getUserById } from './user-service';

describe('getUserById integration', () => {
  it('should connect to database successfully', async () => {
    // Single connection test
  });
});
```

## Code Style Preferences

### Type Safety
- **Zod-First Approach** - Use Zod schemas as the single source of truth for both validation and types
- **Use `z.infer<typeof schema>` for types** - Prefer inferred types over separate interfaces
- **Never use `any`** - Biome enforces this with `noExplicitAny: "error"`
- **Avoid `unknown` unless necessary** - Prefer specific types or properly typed unions
- **Handle null/undefined explicitly** - TypeScript strict mode enforces this
- **Safe array access** - Use validation helpers when needed
- **Type-only imports** - Use `import type` for better performance

#### Zod-First Type Safety Pattern
```typescript
// ✅ Good: Zod schema as single source of truth
const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

type User = z.infer<typeof userSchema>; // Inferred type

// ✅ Good: Safe runtime validation
const validatedUser = userSchema.parse(rawData);

// ✅ Good: Safe array access when needed
import { validateArrayAccess } from '@buster/ai/utils/validation-helpers';
const firstItem = validateArrayAccess(array, 0, 'user processing');

// ❌ Avoid: Separate interface + unsafe access
interface User {
  id: string;
  email: string;
}
const user = rawData as User; // Unsafe type assertion
const firstItem = array[0]!; // Non-null assertion not allowed
```

### Import Organization
- Use **type-only imports** when importing only types: `import type { SomeType } from './types'`
- Biome automatically organizes imports with `pnpm run check:fix`
- Use Node.js protocol: `import { readFile } from 'node:fs'`
- Follow path aliases defined in each package's tsconfig.json

### String Handling
- **Prefer template literals** over string concatenation for better readability
- Use template literals for multi-line strings and string interpolation

#### String Handling Patterns
```typescript
// ✅ Good: Template literals
const message = `User ${userId} not found`;
const multiLine = `This is a
multi-line string`;
const path = `${baseUrl}/api/users/${userId}`;

// ❌ Avoid: String concatenation
const message = 'User ' + userId + ' not found';
const path = baseUrl + '/api/users/' + userId;
```

### Error Handling
- **Always use try-catch blocks** for async operations and external calls
- **Never use `any` in catch blocks** - Biome enforces this
- **Validate external data** with Zod schemas before processing
- **Provide meaningful error messages** with context for debugging
- **Handle errors at appropriate levels** - don't let errors bubble up uncaught
- **Use structured logging** for error tracking

#### Error Handling Patterns
```typescript
// ✅ Good: Comprehensive error handling
async function processUserData(userId: string) {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    
    const validatedData = UserSchema.parse(user);
    return await processData(validatedData);
  } catch (error) {
    logger.error('Failed to process user data', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`User data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ✅ Good: Database operations with error handling
async function createResource(data: CreateResourceInput) {
  try {
    const validatedData = CreateResourceSchema.parse(data);
    return await db.transaction(async (tx) => {
      const resource = await tx.insert(resources).values(validatedData).returning();
      await tx.insert(resourceAudit).values({
        resourceId: resource[0].id,
        action: 'created',
        createdAt: new Date()
      });
      return resource[0];
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Invalid resource data: ${error.errors.map(e => e.message).join(', ')}`);
    }
    logger.error('Database error creating resource', { data, error });
    throw new Error('Failed to create resource');
  }
}

// ❌ Avoid: Unhandled async operations
async function badExample(userId: string) {
  const user = await getUserById(userId); // No error handling
  return user.data; // Could fail if user is null
}
```

## Test Utilities

The `@buster/test-utils` package provides shared testing utilities:

### Environment Helpers
```typescript
import { setupTestEnvironment, withTestEnv } from '@buster/test-utils/env-helpers';

// Manual setup/teardown
beforeAll(() => setupTestEnvironment());
afterAll(() => cleanupTestEnvironment());

// Or use the wrapper
await withTestEnv(async () => {
  // Your test code here
});
```

### Mock Helpers
```typescript
import { createMockFunction, mockConsole, createMockDate } from '@buster/test-utils/mock-helpers';

// Create vitest mock functions
const mockFn = createMockFunction<(arg: string) => void>();

// Mock console methods (allowed in tests)
const consoleMock = mockConsole();
// Test code that logs...
consoleMock.restore();

// Mock dates for time-sensitive tests
const dateMock = createMockDate(new Date('2024-01-01'));
// Test code...
dateMock.restore();
```

### Database Test Helpers
```typescript
import { createTestChat, cleanupTestChats } from '@buster/test-utils/database/chats';
import { createTestMessage, cleanupTestMessages } from '@buster/test-utils/database/messages';

// Create test data
const chat = await createTestChat({
  userId: 'test-user',
  title: 'Test Chat'
});

const message = await createTestMessage({
  chatId: chat.id,
  role: 'user',
  content: 'Test message'
});

// Cleanup after tests
await cleanupTestMessages(chat.id);
await cleanupTestChats('test-user');
```

## Quick Command Reference

### Building & Type Checking
```bash
# Build all packages
turbo run build

# Build specific package/app
turbo run build --filter=@buster/ai
turbo run build --filter=@buster-app/web

# Type check only
turbo run typecheck
turbo run typecheck --filter=@buster/database
```

### Linting & Formatting
```bash
# Check and auto-fix with Biome
pnpm run check:fix path/to/file.ts
pnpm run check:fix packages/ai

# Check only (no fixes)
pnpm run check path/to/file.ts
```

### Testing
```bash
# Run all tests
pnpm run test

# Run tests for specific package
turbo run test --filter=@buster/ai

# Run specific test file
pnpm run test path/to/file.test.ts

# Watch mode
pnpm run test:watch
```

### Database Commands
```bash
pnpm run db:generate    # Generate types from schema
pnpm run db:migrate     # Run migrations
pnpm run db:push        # Push schema changes
pnpm run db:studio      # Open Drizzle Studio
```

## Helper Organization Pattern

When building helper functions, follow this organizational pattern:

### Database Helpers (in `packages/database/`)
```
packages/database/src/helpers/
├── index.ts         # Export all helpers
├── messages.ts      # Message-related helpers
├── users.ts         # User-related helpers  
├── chats.ts         # Chat-related helpers
└── {entity}.ts      # Entity-specific helpers
```

### Package-Specific Utilities
```
packages/{package}/src/utils/
├── index.ts         # Export all utilities
├── {domain}/        # Domain-specific utilities
│   ├── index.ts
│   └── helpers.ts
└── helpers.ts       # General helpers
```

### Key Principles
- **Co-locate helpers** with the schema/types they operate on
- **Group by entity** (one file per database table/domain object)
- **Export from package root** for easy importing
- **Use TypeScript** with proper types (no `any`)
- **Follow naming conventions** that clearly indicate purpose

### Example Usage
```typescript
// ✅ Good: Clear, typed helpers exported from package root
import { getRawLlmMessages, getMessagesForChat } from '@buster/database';

// ❌ Avoid: Direct database queries scattered throughout codebase
import { db, messages, eq } from '@buster/database';
const result = await db.select().from(messages).where(eq(messages.chatId, chatId));
```

## Background Job Processing (Trigger.dev)

The `apps/trigger` package provides background job processing using **Trigger.dev v3**.

### 🚨 CRITICAL: Always Use v3 Patterns

```typescript
// ✅ CORRECT - Always use this pattern
import { task } from '@trigger.dev/sdk/v3';

export const myTask = task({
  id: 'my-task',
  run: async (payload: InputType): Promise<OutputType> => {
    // Task implementation
  },
});
```

### Essential Requirements
1. **MUST export every task** from the file
2. **MUST use unique task IDs** within the project  
3. **MUST import from** `@trigger.dev/sdk/v3`
4. **Use Zod schemas** for payload validation

### Common Task Patterns

#### Schema-Validated Task (Recommended)
```typescript
import { schemaTask } from '@trigger.dev/sdk/v3';
import { z } from 'zod';

// Define schema for type safety
export const TaskInputSchema = z.object({
  userId: z.string(),
  data: z.record(z.unknown()),
});

export type TaskInput = z.infer<typeof TaskInputSchema>;

export const processUserTask = schemaTask({
  id: 'process-user',
  schema: TaskInputSchema,
  maxDuration: 300, // 5 minutes
  run: async (payload) => {
    // Payload is validated and typed
    return { success: true };
  },
});
```

#### Triggering Tasks
```typescript
import { tasks } from '@trigger.dev/sdk/v3';
import type { processUserTask } from '@buster-app/trigger/tasks';

// Trigger from API routes
const handle = await tasks.trigger<typeof processUserTask>('process-user', {
  userId: 'user123',
  data: {}
});
```

### Development Commands
```bash
# Development server
pnpm run trigger:dev

# Run tests
pnpm run trigger:test

# Deploy
pnpm run trigger:deploy
```

**See `apps/trigger/CLAUDE.md` for complete Trigger.dev guidelines.**

## Key Dependencies

- **Turborepo** - Monorepo orchestration and caching
- **pnpm** - Fast, disk space efficient package manager
- **Biome** - Fast linting and formatting (replaces ESLint/Prettier)
- **TypeScript** - Strict type checking across all packages
- **Vitest** - Fast unit testing framework
- **Zod** - Runtime validation and type inference
- **Mastra** - AI agent framework for LLM workflows
- **Trigger.dev v3** - Background job processing
- **Drizzle ORM** - Type-safe database toolkit
- **Braintrust** - LLM observability and evaluation

## Complete Development Workflow Example

When implementing a new feature:

```bash
# 1. Write your modular, testable functions
# 2. Compose them into the feature
# 3. Write tests alongside the code

# 4. Ensure type safety
turbo run build --filter=@buster/ai
# or for all packages:
turbo run build

# 5. Fix linting and formatting
pnpm run check:fix packages/ai

# 6. Run tests
turbo run test --filter=@buster/ai
# or specific test:
pnpm run test packages/ai/src/feature.test.ts

# 7. If all passes, commit your changes
git add .
git commit -m "feat: add new feature"
```

## Slack Package (@buster/slack)

The `@buster/slack` package is a **standalone Slack integration** with no database dependencies. It provides:

### Features
- **OAuth 2.0 Authentication** - Complete OAuth flow with state management
- **Channel Management** - List, validate, join/leave channels
- **Messaging** - Send messages, replies, updates with retry logic
- **Message Tracking** - Interface for threading support
- **Type Safety** - Zod validation throughout

### Architecture
The package uses **interface-based design** where consuming applications must implement:
- `ISlackTokenStorage` - For token persistence
- `ISlackOAuthStateStorage` - For OAuth state management
- `ISlackMessageTracking` - For message threading (optional)

### Usage Pattern
```typescript
// All functions accept tokens as parameters
const channels = await channelService.getAvailableChannels(accessToken);
const result = await messagingService.sendMessage(accessToken, channelId, message);
```

### Testing
```bash
# Run tests
turbo run test --filter=@buster/slack

# Build
turbo run build --filter=@buster/slack

# Type check
turbo run typecheck --filter=@buster/slack
```

### Key Principles
- **No database dependencies** - Uses interfaces for storage
- **Token-based** - All functions accept tokens as parameters
- **Framework-agnostic** - Works with any Node.js application
- **Comprehensive error handling** - Typed errors with retry logic

## Important Notes

- **Never use `any`** - Biome will error on this
- **Always handle errors** properly with try-catch
- **Write tests alongside code** - not in separate folders
- **Use Zod for validation** - single source of truth
- **Run type checks** before committing
- **Follow existing patterns** in the codebase

This ensures high code quality and maintainability across the monorepo.

## Common Biome Overrides

Test files have relaxed rules to allow:
- `console.log` for debugging tests
- Non-null assertions (`!`) in test scenarios
- `any` type when mocking (though prefer proper types)

Database package allows `any` for Drizzle ORM compatibility.

## Environment Variables

The monorepo uses a strict environment mode. Key variables include:
- Database connections (Supabase, PostgreSQL, etc.)
- API keys (OpenAI, Anthropic, etc.)
- Service URLs and configurations

See `.env.example` files in each package for required variables.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.