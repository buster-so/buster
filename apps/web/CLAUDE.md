# Web Application Development Guide

This is the main React web application built with TanStack Start. It assembles packages to create the user interface.

## Core Responsibility

`@buster-app/web` is responsible for:
- User interface and interactions
- Client-side routing with TanStack Router
- State management with TanStack Store
- API communication via server-shared types
- Real-time updates with Electric SQL

---

# Cursor Rules (Global Configuration)

---
alwaysApply: true
---
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
**IMPORTANT: Before finishing any task or creating PRs, always run:**
```bash
# 1. Run unit tests for the entire monorepo
turbo run test:unit

# 2. Build the entire monorepo to ensure everything compiles
turbo run build

# 3. Run linting for the entire monorepo
turbo run lint
```

**Key Testing Guidelines:**
- **Always run unit tests, build, and lint** when working locally before considering a task complete
- **Unit tests** should be run for the entire monorepo to catch any breaking changes
- **Build** must pass for the entire monorepo to ensure type safety
- **Integration tests** should only be run for specific packages/features you're working on (NOT the entire monorepo)
- **Fix all failing tests, build errors, and lint errors** before completing any task
- **Heavily bias toward unit tests** - they are faster and cheaper to run
- **Mock everything you can** in unit tests for isolation and speed

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
# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

---

# Web-Specific Patterns

## TanStack Start Framework

### File-Based Routing

Routes are defined in the `src/routes/` directory using a hierarchical structure:

```
routes/
├── __root.tsx              # Global app shell
├── app.tsx                 # Main app route with auth
├── _app.tsx                # Pathless layout wrapper
├── _app/
│   ├── dashboard/
│   │   ├── index.tsx      # /dashboard
│   │   └── $dashboardId.tsx # /dashboard/:dashboardId
│   ├── metrics/
│   │   └── index.tsx      # /metrics
│   └── chats/
│       ├── index.tsx      # /chats
│       └── $chatId.tsx    # /chats/:chatId
└── _settings.tsx          # Settings layout
```

### Layout Patterns

#### Pathless Routes

Use underscore prefix for layout routes that don't affect URLs:

```typescript
// _app.tsx - Creates layout without affecting URL
export default function AppLayout() {
  return (
    <PrimaryAppLayout>
      <Outlet />
    </PrimaryAppLayout>
  );
}
```

#### Route Context

```typescript
// app.tsx - Setup route context
export const Route = createFileRoute('/app'){
  beforeLoad: async ({ context }) => {
    const user = await getUser();
    if (!user) throw redirect({ to: '/login' });
    
    return {
      user,
      organizations: await getUserOrganizations(user.id)
    };
  },
  component: AppRoute
};
```

### Type-Safe Links

Components accepting link props need proper TypeScript generics:

```typescript
export type BusterListRowLink<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = Record<string, unknown>,
  TFrom extends string = string,
> = {
  link: ILinkProps<TRouter, TOptions, TFrom>;
  preloadDelay?: LinkProps['preloadDelay'];
  preload?: LinkProps['preload'];
};

// Usage
const rows: BusterListRowItem<DataType, RegisteredRouter, {}, string>[] = [
  {
    id: '1',
    data: myData,
    link: {
      to: '/app/dashboard/$dashboardId',
      params: { dashboardId: '123' }
    }
  }
];
```

## Component Organization

### Directory Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── dialog.tsx
│   └── features/           # Feature-specific components
│       ├── dashboard/
│       ├── metrics/
│       └── chats/
├── controllers/            # Page-level orchestration
├── context/               # React Context providers
└── hooks/                 # Custom React hooks
```

### Component Patterns

#### Functional Components Only

```typescript
// ✅ Good - Functional component
export function UserCard({ user }: UserCardProps) {
  return (
    <Card>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </Card>
  );
}

// ❌ Bad - Class component
class UserCard extends React.Component {}
```

#### Props Validation with Zod

```typescript
import { z } from 'zod';

const UserCardPropsSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email()
  }),
  onEdit: z.function().optional()
});

type UserCardProps = z.infer<typeof UserCardPropsSchema>;

export function UserCard(props: UserCardProps) {
  const validated = UserCardPropsSchema.parse(props);
  // Component implementation
}
```

## State Management

### TanStack Store

```typescript
// stores/user-store.ts
import { Store } from '@tanstack/store';

export const userStore = new Store({
  user: null as User | null,
  organizations: [] as Organization[],
  selectedOrgId: null as string | null
});

// Usage in component
import { useStore } from '@tanstack/react-store';

export function UserProfile() {
  const user = useStore(userStore, (state) => state.user);
  
  return <div>{user?.name}</div>;
}
```

### TanStack Query

```typescript
// queries/user-queries.ts
import { queryOptions } from '@tanstack/react-query';
import type { GetUserResponse } from '@buster/server-shared/users';

export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/v2/users/${userId}`);
      return response.json() as Promise<GetUserResponse>;
    }
  });

// Usage
import { useSuspenseQuery } from '@tanstack/react-query';

export function UserDetails({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery(userQueryOptions(userId));
  return <div>{data.user.name}</div>;
}
```

## API Communication

### Type-Safe API Calls

```typescript
import type { 
  CreateDashboardRequest,
  CreateDashboardResponse 
} from '@buster/server-shared/dashboards';

export async function createDashboard(
  data: CreateDashboardRequest
): Promise<CreateDashboardResponse> {
  const response = await fetch('/api/v2/dashboards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create dashboard');
  }
  
  return response.json();
}
```

## Real-Time Updates

### Electric SQL Integration

```typescript
// hooks/use-electric.ts
import { useElectric } from '../integrations/electric';

export function useLiveDashboard(dashboardId: string) {
  const electric = useElectric();
  
  const { results } = electric.db.dashboards.liveMany({
    where: {
      id: dashboardId
    }
  });
  
  return results[0];
}
```

## Testing Patterns

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

describe('UserCard', () => {
  it('should display user information', () => {
    const user = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    };
    
    render(<UserCard user={user} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('should call onEdit when edit button clicked', async () => {
    const onEdit = jest.fn();
    const user = { id: '1', name: 'Test', email: 'test@example.com' };
    
    render(<UserCard user={user} onEdit={onEdit} />);
    
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    
    expect(onEdit).toHaveBeenCalledWith(user);
  });
});
```

## Performance Optimization

### Code Splitting

```typescript
import { lazy } from 'react';

// Lazy load heavy components
const DashboardEditor = lazy(() => import('./components/DashboardEditor'));

export function Dashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardEditor />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo } from 'react';

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const processedData = useMemo(
    () => expensiveProcessing(data),
    [data]
  );
  
  return <div>{processedData}</div>;
});
```

## Browser Caching

### Status Codes

Use 307 for temporary redirects to avoid browser caching:

```typescript
// ✅ Good - No caching
return redirect({ to: '/dashboard' }, { status: 307 });

// ❌ Bad - Browser caches redirect
return redirect({ to: '/dashboard' }, { status: 301 });
```

## Best Practices

### DO:
- Use functional components exclusively
- Import types from server-shared
- Validate props with Zod
- Use TanStack Query for server state
- Use TanStack Store for client state
- Implement error boundaries
- Use Suspense for loading states
- Memoize expensive computations

### DON'T:
- Use class components
- Define API types locally
- Use useState for server data
- Skip error handling
- Use console.log
- Create files unless necessary
- Use any type

This app should ONLY assemble packages and handle UI concerns. All business logic belongs in packages.