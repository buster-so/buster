# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Server Package Overview

This is the Buster API server built with Hono.js and TypeScript, designed to be runtime-agnostic but currently using Bun. The server follows a clean architecture pattern where API routes consume business logic from `@/packages` and focus primarily on HTTP concerns.

## Development Commands

### Local Development
```bash
# Start development server with full stack (Redis, Supabase, Electric, etc.)
make dev

# Start server only (requires dependencies to be running)
bun dev

# Build for production
bun run build

# Run production build
bun run prod

# Stop services
make stop
```

### Dependencies
The `make dev` command automatically:
- Starts Redis container for caching
- Starts Supabase local development stack
- Resets database schema
- Starts Electric SQL service
- Runs the development server

## Architecture

### API Structure
- **Versioned APIs**: Routes organized by version (`/api/v2/`) for backward compatibility
- **Feature-based routing**: Each feature has its own subdirectory (e.g., `users/`, `electric-shape/`)
- **Thin controllers**: API routes focus on HTTP concerns while delegating business logic to packages

### Package Consumption Pattern
API routes consume business logic from monorepo packages:
```typescript
import { getUserById } from '@/packages/users';

app.get('/v2/user/:id', async (c) => {
  const user = await getUserById(userId);
  return c.json(user);
});
```

### Middleware Stack
- **Global middleware**: CORS, logging applied to all routes
- **Authentication**: Supabase JWT-based auth with `requireAuth` middleware
- **Error handling**: Centralized error and 404 handlers

### Key Directories
- `src/api/v2/`: Current API version with feature-specific routes
- `src/middleware/`: Reusable middleware (auth, CORS, logging)
- `src/utils/`: Shared utilities and response helpers
- `src/types/`: TypeScript definitions

## Configuration

### Path Aliases
```typescript
"@/*": ["src/*"],
"@/access-controls/*": ["../packages/access-controls/src/*"]
```

### Environment
- Default port: 3002
- Development URLs allowed in CORS: `localhost:3000`, `localhost:3001`
- Supabase integration for authentication

## Development Patterns

### Route Organization
Each feature should have its own route module that exports a Hono app instance:
```typescript
// src/api/v2/feature/index.ts
const app = new Hono();
app.use('*', requireAuth); // Apply auth if needed
// ... route definitions
export default app;
```

### Authentication
Use `requireAuth` middleware for protected routes. User data is available via `c.get('supabaseUser')`.

### Error Handling
Use standardized response utilities from `src/utils/response.ts`:
- `errorResponse()` for general errors
- `notFoundResponse()` for 404s
- `unauthorizedResponse()` for auth failures

### Request/Response Validation
This server uses **Zod + Hono** for comprehensive type-safe validation:

#### Zod Schema Pattern
Define schemas in `src/types/` that provide both runtime validation and TypeScript types:
```typescript
// src/types/feature.types.ts
import { z } from 'zod';

export const CreateRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

export const CreateResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
});

// Infer TypeScript types from schemas
export type CreateRequest = z.infer<typeof CreateRequestSchema>;
export type CreateResponse = z.infer<typeof CreateResponseSchema>;
```

#### Route Implementation with zValidator
Use `@hono/zod-validator` for automatic request validation:
```typescript
import { zValidator } from '@hono/zod-validator';
import { CreateRequestSchema, CreateResponseSchema } from '../../../types/feature.types';

app.post('/', zValidator('json', CreateRequestSchema), async (c) => {
  const request = c.req.valid('json'); // Fully typed!
  
  // Business logic here
  const response = await handleRequest(request);
  
  // Optional: validate response
  const validatedResponse = CreateResponseSchema.parse(response);
  return c.json(validatedResponse);
});
```

#### Validation Features
- **Runtime safety**: Automatic validation with detailed error messages
- **Type inference**: TypeScript types automatically derived from schemas
- **UUID validation**: Use `z.string().uuid()` for ID fields
- **Custom validation**: Use `.refine()` for complex business rules
- **Future-ready**: Schemas can generate OpenAPI docs with `@hono/zod-openapi`

#### Validation Best Practices
- Always define Zod schemas before implementing routes
- Use descriptive error messages in custom validations
- Validate both request inputs and response outputs for critical endpoints
- Leverage Zod's built-in validators (`.email()`, `.uuid()`, `.min()`, etc.)
- Group related schemas in the same type file

### Type Safety
- Strict TypeScript configuration enabled
- All request/response types derived from Zod schemas
- Runtime validation ensures type safety at API boundaries