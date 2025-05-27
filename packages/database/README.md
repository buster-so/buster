# @buster/database

A Bun-based database library using Drizzle ORM with PostgreSQL connection pooling. This library provides a centralized database connection and schema management for the Buster application.

## Features

- 🔄 **Connection Pooling**: Efficient PostgreSQL connection management
- 📊 **Schema Introspection**: Auto-generated TypeScript types from existing database
- 🔧 **Migration Management**: Full migration lifecycle support
- 🏗️ **Type Safety**: Complete TypeScript support with inferred types
- 🚀 **Performance**: Optimized for serverless and traditional deployments

## Installation

```bash
cd packages/database
bun install
```

## Environment Setup

Ensure your `.env` file contains:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

## Quick Start

### Basic Usage

```typescript
import { getDb, users, eq } from '@buster/database';

// Get database instance
const db = getDb();

// Query users
const allUsers = await db.select().from(users);

// Find user by ID
const user = await db.select().from(users).where(eq(users.id, userId));

// Insert new user
const [newUser] = await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com'
}).returning();
```

### Connection Pool Management

```typescript
import { initializePool, closePool, type PoolConfig } from '@buster/database';

// Initialize with custom pool configuration
const config: PoolConfig = {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 30,
  prepare: false
};

const db = initializePool(config);

// Graceful shutdown
await closePool();
```

## Database Schema

The schema has been introspected from your existing database and includes:

- **41 tables** with complete type definitions
- **386 columns** with proper TypeScript types
- **12 enums** for type safety
- **39 indexes** for performance
- **85 foreign keys** for referential integrity

### Key Tables

- `users` - User management
- `organizations` - Organization structure
- `teams` - Team management
- `dashboards` - Dashboard configurations
- `datasets` - Data source definitions
- `collections` - Asset collections
- `api_keys` - API authentication
- And many more...

## Migration Workflow

### For Existing Database (Current Setup)

Since this library was created from an existing database, the initial state has been captured:

```bash
# The database was introspected and schema generated
bun run db:pull

# Initial migration file created: drizzle/0000_uneven_black_widow.sql
# This represents your current database state
```

### Future Schema Changes

When you need to make schema changes:

1. **Update the schema** in `src/schema.ts`
2. **Generate migration**:

   ```bash
   bun run db:generate
   ```

3. **Apply migration**:

   ```bash
   bun run db:migrate
   ```

### Available Scripts

```bash
# Database introspection and setup
bun run db:setup          # Full setup for existing database
bun run db:pull           # Pull schema from database
bun run db:validate       # Validate schema against database

# Migration management
bun run db:generate       # Generate migration from schema changes
bun run db:migrate        # Apply pending migrations
bun run db:push           # Push schema directly (dev only)
bun run db:check          # Check for migration conflicts

# Development tools
bun run db:studio         # Open Drizzle Studio
bun run db:snapshot       # Generate current state snapshot
```

## Usage in Other Packages

### In Tasks Package

```typescript
// tasks/src/some-task.ts
import { getDb, users, organizations, eq } from '@buster/database';

export async function processUsers() {
  const db = getDb();
  
  const activeUsers = await db
    .select()
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.isActive, true));
    
  // Process users...
}
```

### In Server Package

```typescript
// server/src/handlers/user-handler.ts
import { getDb, users, eq, type User } from '@buster/database';

export async function getUserHandler(userId: string): Promise<User | null> {
  const db = getDb();
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));
    
  return user || null;
}
```

## Type Safety

All database tables have automatically generated TypeScript types:

```typescript
import type { 
  User,           // Select type for users table
  NewUser,        // Insert type for users table
  Dashboard,      // Select type for dashboards table
  NewDashboard,   // Insert type for dashboards table
  // ... and many more
} from '@buster/database';

// Type-safe operations
const userData: NewUser = {
  name: 'John Doe',
  email: 'john@example.com',
  // TypeScript will enforce correct types
};
```

## Advanced Usage

### Transactions

```typescript
import { getDb, users, organizations } from '@buster/database';

const db = getDb();

await db.transaction(async (tx) => {
  const [org] = await tx.insert(organizations).values({
    name: 'New Org'
  }).returning();
  
  await tx.insert(users).values({
    name: 'Admin User',
    email: 'admin@neworg.com',
    organizationId: org.id
  });
});
```

### Raw SQL

```typescript
import { getDb, sql } from '@buster/database';

const db = getDb();

const result = await db.execute(sql`
  SELECT COUNT(*) as user_count 
  FROM users 
  WHERE created_at > NOW() - INTERVAL '30 days'
`);
```

## Migration from Other ORMs

This library was specifically designed to migrate from your existing ORM setup. The introspection process captured your current database state, so you can:

1. **Gradually migrate** your existing code to use this library
2. **Maintain compatibility** with your current database structure
3. **Add new features** using Drizzle's type-safe API

## Troubleshooting

### Connection Issues

```bash
# Verify database connection
bun run db:validate
```

### Schema Drift

If your database schema changes outside of migrations:

```bash
# Re-sync with database
bun run db:pull

# Generate new migration
bun run db:generate
```

### Performance

The connection pool is configured for optimal performance:

- **Max connections**: 20 (configurable)
- **Idle timeout**: 30 seconds
- **Connect timeout**: 30 seconds
- **Prepared statements**: Disabled by default (configurable)

## Contributing

When adding new tables or modifying existing ones:

1. Update the schema in `src/schema.ts`
2. Generate and test migrations
3. Update this README if needed
4. Ensure type exports are properly configured

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit CLI](https://orm.drizzle.team/docs/kit-overview)
- [PostgreSQL with Drizzle](https://orm.drizzle.team/docs/get-started/postgresql-existing)
