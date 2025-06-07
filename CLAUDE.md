# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Development Standards

### Code Quality Tools

This project uses a comprehensive toolchain to ensure high code quality and consistency:

#### Biome (Linting & Formatting)
- **Always run Biome** before committing code
- Use `npm run check:fix [path]` for complete linting, formatting, and import organization
- Biome configuration is in `biome.json` with strict rules and workspace-specific overrides
- Key rules enforced:
  - `useImportType: "error"` - Enforces type-only imports for better performance
  - `noExplicitAny: "warn"` - Discourages loose typing (avoid `any`, prefer specific types)
  - `noUnusedImports/Variables: "error"` - Keeps code clean
  - `noConsoleLog: "warn"` - Prevents console logs in production code (disabled in tests)

#### TypeScript
- **Strict mode enabled** with additional safety checks
- `noUncheckedIndexedAccess: true` - Prevents array/object access bugs
- `noUnusedLocals/Parameters: true` - Ensures clean code
- Path aliases configured for clean imports (see individual package tsconfig.json files)
- Always run `npm run typecheck [workspace]` before committing

#### Testing with Vitest
- **All tests use Vitest** for consistency across the monorepo
- Global vitest config in `vitest.config.ts` with workspace support
- Environment variables automatically loaded from `.env` files
- Test timeouts set to 30 seconds for LLM operations

### Development Commands

#### Linting & Formatting
```bash
# Lint specific files or directories
npm run lint path/to/file.ts
npm run lint packages/ai/src

# Auto-fix linting issues
npm run lint:fix path/to/file.ts
npm run lint:fix packages/ai

# Format code
npm run format path/to/file.ts
npm run format packages/ai

# Auto-fix formatting
npm run format:fix path/to/file.ts
npm run format:fix packages/ai

# Complete check (lint + format + organize imports)
npm run check path/to/file.ts
npm run check packages/ai

# Complete check with auto-fix
npm run check:fix path/to/file.ts
npm run check:fix packages/ai
```

#### Testing
```bash
# Run all tests
npm run test

# Run specific test files or patterns
npm run test:file path/to/test.ts
npm run test:file packages/ai/tests/workflows/**/*

# Watch mode for development
npm run test:watch
npm run test:watch:file path/to/test.ts

# Coverage and UI
npm run test:coverage
npm run test:ui
```

#### TypeScript Checking
```bash
# Type check specific workspace
npm run typecheck packages/ai
npm run typecheck packages/database
```

#### Pre-commit & CI
```bash
# Recommended before committing
npm run pre-commit  # Runs lint:fix + format:fix

# Full CI check
npm run ci:check    # Runs check + typecheck
```

## Code Style Preferences

### Type Safety
- **Avoid `unknown` unless absolutely necessary** - prefer specific types or properly typed unions
- **Avoid `any`** - use specific types, generics, or proper TypeScript patterns
- Use Zod schemas for runtime validation and type inference
- Leverage TypeScript's strict mode features

### Import Organization
- Use **type-only imports** when importing only types: `import type { SomeType } from './types'`
- Organize imports automatically with Biome's `organizeImports`
- Use path aliases when available (see tsconfig.json in each package)

### Error Handling
- Use proper error types instead of `unknown` or `any`
- Validate external data with Zod schemas
- Provide meaningful error messages

### Testing Practices
- Write integration tests for complex workflows
- Use descriptive test names that explain the behavior being tested
- Mock external dependencies appropriately
- Use proper TypeScript types in tests (avoid `any`)

## Test Utilities

The `@buster/test-utils` package provides shared testing utilities for the monorepo:

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

// Mock console methods
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

## Project Structure

This is a monorepo with multiple packages:

- `packages/ai/` - AI agents, tools, and workflows using Mastra framework
- `packages/database/` - Database schema, migrations, and utilities
- `packages/test-utils/` - Shared testing utilities for environment setup, mocking, and database helpers
- `web/` - Next.js frontend application
- `api/` - Rust backend API
- `cli/` - Command-line tools
- `trigger/` - Background job processing

Each package has its own development commands and may have specific tooling configurations.

### Helper Organization Pattern

When building helper functions around database objects or other utilities, follow this organizational pattern:

**For Database Helpers (in `packages/database/`):**
```
packages/database/src/helpers/
├── index.ts         # Export all helpers
├── messages.ts      # Message-related helpers
├── users.ts         # User-related helpers  
├── chats.ts         # Chat-related helpers
└── {entity}.ts      # Entity-specific helpers
```

**For Package-Specific Utilities:**
```
packages/{package}/src/utils/
├── index.ts         # Export all utilities
├── {domain}/        # Domain-specific utilities
│   ├── index.ts
│   └── helpers.ts
└── helpers.ts       # General helpers
```

**Key Principles:**
- **Co-locate helpers** with the schema/types they operate on
- **Group by entity** (one file per database table/domain object)
- **Export from package root** for easy importing: `import { getRawLlmMessages } from '@buster/database'`
- **Use TypeScript** for full type safety with inferred types
- **Follow naming conventions** that clearly indicate the helper's purpose

**Example Usage:**
```typescript
// Good: Clear, typed helpers exported from package root
import { getRawLlmMessages, getMessagesForChat } from '@buster/database';

// Avoid: Direct database queries scattered throughout codebase
import { db, messages, eq } from '@buster/database';
const result = await db.select().from(messages).where(eq(messages.chatId, chatId));
```

## Key Dependencies

- **Mastra** - AI agent framework for orchestrating LLM workflows
- **Vitest** - Testing framework used across all packages
- **Biome** - Fast linting and formatting
- **TypeScript** - Strict type checking
- **Zod** - Runtime validation and type inference
- **Braintrust** - LLM observability and evaluation

## Working with Claude Code

When making changes:

1. **Always run tooling checks** before and after modifications
2. **Use specific types** instead of `any` or `unknown` when possible
3. **Run tests** to ensure changes don't break existing functionality
4. **Follow existing patterns** in the codebase for consistency
5. **Use the provided scripts** for linting, formatting, and testing

Example workflow:
```bash
# Before making changes
npm run check packages/ai

# After making changes
npm run check:fix packages/ai
npm run test:file packages/ai/tests/path/to/relevant/test.ts
npm run typecheck packages/ai
```

This ensures high code quality and prevents issues from reaching production.