# CLAUDE.md

This file provides core guidance to Claude/AI assistants when working with the Buster monorepo.

**Note**: Each package and app has its own CLAUDE.md with specific implementation details. This document contains only universal principles.

## Monorepo Philosophy

### Architecture Principles
1. **Packages are standalone building blocks** - Modular components with minimal cross-dependencies
2. **Apps assemble packages** - Apps piece together package code, never contain business logic directly
3. **Avoid spaghetti dependencies** - Keep clean boundaries between packages
4. **Type flow hierarchy** - Types flow: `database` → `server-shared` → `apps`

### Critical Package Boundaries
- **`@buster/database`** - Owns ALL database queries. No direct Drizzle usage elsewhere
- **`@buster/server-shared`** - API contract layer. All request/response types live here
- **`@buster/data-source`** - Isolated data source connection logic for customer databases
- **Package imports** - Packages can use each other but maintain clear, logical dependencies

## Development Principles

### Functional Programming First
- **Pure functions only** - No classes for business logic
- **Composable modules** - Build features by composing small, focused functions
- **Immutable data** - Never mutate; always create new data structures
- **Higher-order functions** - Use functions that return configured functions for dependency injection
- **No OOP** - No classes, no inheritance, no `this` keyword in business logic

### Type Safety Standards
- **Zod-first everything** - Define ALL types as Zod schemas with descriptions
- **Export inferred types** - Always use `z.infer<typeof Schema>` for TypeScript types
- **Runtime validation** - Use `.parse()` for trusted data, `.safeParse()` for user input
- **No implicit any** - Every variable, parameter, and return type must be explicitly typed
- **Constants for strings** - Use const assertions for type-safe string literals

### Testing Philosophy
- **Test-driven development** - Write tests and assertions first, then implement
- **Colocate tests** - Keep `.test.ts` (unit) and `.int.test.ts` (integration) next to implementation
- **Test naming** - If file is `user.ts`, tests are `user.test.ts` and/or `user.int.test.ts`
- **Minimize integration dependencies** - Most logic should be testable with unit tests
- **Test descriptions** - Test names should describe the assertion and situation clearly

## Development Workflow

### Command Standards
**CRITICAL**: Only use Turbo commands. Never use pnpm, npm, or vitest directly.

```bash
# Build commands
turbo build           # Build entire monorepo
turbo build --filter=@buster/ai  # Build specific package

# Linting
turbo lint            # Lint entire monorepo
turbo lint --filter=@buster-app/web  # Lint specific app

# Testing
turbo test:unit       # Run all unit tests
turbo test:unit --filter=@buster/database  # Test specific package
turbo test:integration --filter=@buster/ai  # Integration tests for specific package

# Development
turbo dev             # Start development servers
```

### Pre-Completion Checklist
Before completing any task:
1. Run `turbo build` - Ensure everything compiles
2. Run `turbo lint` - Fix all linting issues
3. Run `turbo test:unit` - All unit tests must pass

## Code Organization

### File Structure
- **Small, focused files** - Each file has a single responsibility
- **Deep nesting is OK** - Organize into logical subdirectories
- **Explicit exports** - Use named exports and comprehensive index.ts files
- **Functional patterns** - Export factory functions that return configured function sets

### Module Patterns
```typescript
// Good: Functional approach with Zod
import { z } from 'zod';

const UserParamsSchema = z.object({
  userId: z.string().describe('Unique user identifier'),
  orgId: z.string().describe('Organization identifier')
});

type UserParams = z.infer<typeof UserParamsSchema>;

export function validateUser(params: UserParams) {
  const validated = UserParamsSchema.parse(params);
  // Implementation
}

// Bad: Class-based approach
class UserService {  // Never do this
  validateUser() { }
}
```

### Import Patterns
- **Always use top-level imports** - Import all dependencies at the top of the file
- **No dynamic imports** - Avoid `await import()` in the middle of functions
- **Rationale** - Prioritize code simplicity and consistency over premature optimization
- **Exception** - Only use dynamic imports if you have clear evidence of measurable startup performance issues

```typescript
// Good: Top-level imports
import { runHeadless } from '../services/headless-handler';
import { render } from 'ink';

export function handleCommand(options) {
  if (options.prompt) {
    return runHeadless(options);
  }
  return render(<Main />);
}

// Bad: Dynamic imports without justification
export async function handleCommand(options) {
  if (options.prompt) {
    const { runHeadless } = await import('../services/headless-handler');
    return runHeadless(options);
  }
  return render(<Main />);
}
```

## Cross-Cutting Concerns

### Environment Variables
- Centralized at root level in `.env` file
- Turbo passes variables via `globalEnv` configuration
- Individual packages validate their required variables

### Database Operations
- ALL queries go through `@buster/database` package
- Never use Drizzle directly outside the database package
- Soft deletes only (use `deleted_at` field)
- Prefer upserts over updates

### API Development
- Request/response types in `@buster/server-shared`
- Import database types through server-shared for consistency
- Validate with Zod at API boundaries
- Use type imports: `import type { User } from '@buster/database'`

## Legacy Code Migration
- **Rust code** (`apps/api`) is legacy and being migrated to TypeScript
- Focus new development on TypeScript patterns
- Follow patterns in `apps/server` for new API development

## Agent Workflows
- Use `planner` agent for spec, plan, ticket, research development workflows. 

## Important Reminders
- Do only what has been asked; nothing more, nothing less
- Never create files unless absolutely necessary
- Always prefer editing existing files over creating new ones
- Never proactively create documentation unless explicitly requested
- Check package/app-specific CLAUDE.md files for implementation details