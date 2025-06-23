## Overview

This server is part of the Buster monorepo and provides a robust API layer with middleware support and utility functions. It contains all the API routes that can be consumed by the Buster application, serving as the central backend service for data processing, user management, and business logic. The server is designed to be runtime-agnostic but will use Bun in the meantime.

## Installation

To install dependencies:
```sh
bun install
```

## Development

To run the development server:
```sh
bun run dev
```

The server will be available at http://localhost:3002 (unless specified otherwise in the .env file under PORT)

## Folder Structure

```
src/
├── api/          # API route handlers and endpoints
│   ├── v2/       # Version 2 API routes (current)
│   │   ├── datasets/ # Dataset related routes
│   │   ├── user/ # User management routes  
│   │   └── ...   # Feature-specific route groups
├── middleware/   # Custom middleware functions
│   ├── cors.ts   # CORS configuration
│   ├── logger.ts # Request logging
│   └── ...       # Other middleware
├── utils/        # Utility functions and helpers
│   └── ...            # Other utilities
└── app.ts        # Main Hono application setup
```

### Directory Guidelines

- **`src/api/`**: Contains all route handlers organized by API version, then by feature or resource. Each version directory (e.g., `v2/`, `v3/`) contains feature-specific subdirectories that export Hono app instances for mounting to the main app.

- **API Versioning**: Routes are organized by version to ensure backward compatibility and smooth API evolution. **Note**: `v1/` was deprecated and removed as part of a migration. Current structure includes:
  - `src/api/v2/user/` - Version 2 user management endpoints (current)
  - `src/api/v2/datasets/` - Version 2 datasets endpoints (current)

- **`src/middleware/`**: Custom middleware functions that can be applied globally or to specific routes. Follow Hono's middleware patterns for consistency.

- **`src/utils/`**: Shared utility functions, validators, response helpers, and other common functionality used across the application.

## Business Logic Architecture

The server follows a clean architecture pattern where **API routes consume business logic through packages** located in `@/packages`. This separation ensures that:

- Business logic is reusable across different parts of the application
- API routes remain thin and focused on HTTP concerns
- Core functionality is testable independently of the web layer

### Package Consumption Pattern

For most features, API routes will consume corresponding packages for their business logic:

```typescript
// Example: V2 User API routes consume the users package
import { getUserById, createUser, updateUser } from '@/packages/users';

// API route handlers focus on HTTP concerns
app.get('/v2/user/:id', async (c) => {
  const userId = c.req.param('id');
  
  // Business logic is handled by packages
  const user = await getUserById(userId);
  
  return c.json(user);
});
```

### Package Structure

Each package in `@/packages` typically contains:
- **Queries**: Database operations and data access logic
- **Business Logic**: Core functionality, validation, and business rules  
- **Types**: TypeScript definitions specific to that domain

### Examples

- `@/packages/users` - User management, profile operations
- `@/packages/datasets` - Dataset management
- `@/packages/database` - Raw Database connection, migrations, shared utilities (rarely used)

This architecture keeps the server layer focused on HTTP routing, middleware, and request/response handling while delegating domain logic to specialized packages.

## Best Practices

- Use TypeScript for type safety
- Organize routes by feature in the `api/` directory
- Keep middleware focused and reusable
- Use proper error handling with Hono's error utilities
- Leverage Hono's built-in validation and serialization
- Follow RESTful conventions for API endpoints
