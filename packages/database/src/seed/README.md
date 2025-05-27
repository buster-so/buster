# Database Seeding System

A comprehensive seeding system for your Drizzle database that makes it easy to create, manage, and run seed scripts for testing and development.

## Features

- 🌱 **Easy seed creation** with templates
- 📦 **Dependency management** between seeds
- 📸 **Database snapshots** for capturing existing data
- 🔄 **Idempotent seeds** that can be run multiple times safely
- 🎯 **Targeted seeding** for specific tables or environments
- 📊 **Detailed reporting** of seed execution results

## Quick Start

### 1. Create your first seed

```bash
# Generate a basic seed
bun run seed:generate my-first-seed

# Generate an advanced seed with dependencies
bun run seed:generate user-data --template advanced-seed --tables users,organizations
```

### 2. Edit the generated seed file

Open `src/seed/scripts/my-first-seed.ts` and add your seeding logic:

```typescript
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import type { SeedConfig, SeedResult } from '../index.js';
import { users, organizations } from '../../schema.js';

export const config: SeedConfig = {
  name: 'my-first-seed',
  description: 'Creates initial users and organizations',
  dependencies: [], 
  tables: ['users', 'organizations']
};

export async function seed(db: PostgresJsDatabase): Promise<SeedResult> {
  console.log('🌱 Running my first seed');
  
  let recordsCreated = 0;
  
  try {
    // Create organization
    const [org] = await db.insert(organizations).values({
      name: 'Test Organization',
      // ... other required fields
    }).returning();
    recordsCreated++;

    // Create users
    await db.insert(users).values({
      email: 'admin@example.com',
      name: 'Admin User',
      organizationId: org.id,
      // ... other required fields
    });
    recordsCreated++;

    return {
      name: config.name,
      success: true,
      duration: 0,
      recordsCreated
    };
  } catch (error) {
    throw new Error(`Failed to run seed: ${error}`);
  }
}
```

### 3. Run your seed

```bash
# Run a specific seed
bun run seed run my-first-seed

# Run all seeds
bun run seed run

# Run multiple specific seeds
bun run seed run seed1,seed2,seed3
```

## Commands

### Seed Management

```bash
# List available seeds
bun run seed list seeds

# Run specific seeds
bun run seed run my-seed

# Run all seeds
bun run seed run all
```

### Seed Generation

```bash
# Generate a basic seed
bun run seed:generate my-seed

# Generate with template and options
bun run seed:generate my-seed \
  --template advanced-seed \
  --description "My custom seed" \
  --tables users,posts \
  --dependencies basic-data

# List available templates
bun run seed:generate list-templates
```

### Snapshots

```bash
# Create a snapshot of all data
bun run seed snapshot production-backup

# Create a snapshot of specific tables
bun run seed snapshot user-data users,profiles,organizations

# List available snapshots
bun run seed list snapshots

# Clean up old snapshots (keep 5 most recent)
bun run seed cleanup 5
```

## Seed Structure

Every seed file must export two things:

1. **config**: Metadata about the seed
2. **seed**: The function that performs the seeding

```typescript
export const config: SeedConfig = {
  name: 'my-seed',
  description: 'Description of what this seed does',
  dependencies: ['other-seed'], // Seeds that must run first
  tables: ['users', 'posts'] // Tables this seed affects
};

export async function seed(db: PostgresJsDatabase): Promise<SeedResult> {
  // Your seeding logic here
  return {
    name: config.name,
    success: true,
    duration: 0,
    recordsCreated: 10
  };
}
```

## Best Practices

### 1. Make Seeds Idempotent

Always check if data already exists before inserting:

```typescript
// ✅ Good - Check before inserting
const existingUser = await db.select()
  .from(users)
  .where(eq(users.email, 'admin@example.com'))
  .limit(1);

if (existingUser.length === 0) {
  await db.insert(users).values({
    email: 'admin@example.com',
    // ...
  });
}

// ❌ Bad - Will fail on second run
await db.insert(users).values({
  email: 'admin@example.com', // Unique constraint violation
  // ...
});
```

### 2. Use Dependencies for Order

```typescript
export const config: SeedConfig = {
  name: 'user-posts',
  dependencies: ['users'], // Run users seed first
  tables: ['posts']
};
```

### 3. Handle Relationships Properly

```typescript
// Get existing data for relationships
const [organization] = await db.select().from(organizations).limit(1);
if (!organization) {
  throw new Error('No organization found. Run organization seed first.');
}

// Use the ID in related records
await db.insert(users).values({
  organizationId: organization.id,
  // ...
});
```

### 4. Environment-Specific Seeding

```typescript
export async function seed(db: PostgresJsDatabase): Promise<SeedResult> {
  let recordsCreated = 0;
  
  // Always create essential data
  await createEssentialData(db);
  recordsCreated += 5;
  
  // Only create test data in development
  if (process.env.NODE_ENV === 'development') {
    await createTestData(db);
    recordsCreated += 100;
  }
  
  return { name: config.name, success: true, duration: 0, recordsCreated };
}
```

### 5. Bulk Operations for Performance

```typescript
// ✅ Good - Bulk insert
const users = Array.from({ length: 100 }, (_, i) => ({
  email: `user${i}@example.com`,
  name: `User ${i}`,
  organizationId: org.id
}));

await db.insert(users).values(users);

// ❌ Bad - Individual inserts
for (let i = 0; i < 100; i++) {
  await db.insert(users).values({
    email: `user${i}@example.com`,
    name: `User ${i}`,
    organizationId: org.id
  });
}
```

## Templates

### Basic Template

Use for simple, straightforward seeding:

```bash
bun run seed:generate my-seed --template basic-seed
```

### Advanced Template

Use for complex seeding with relationships and bulk operations:

```bash
bun run seed:generate my-seed --template advanced-seed
```

## Snapshots

Snapshots capture the current state of your database and can be used to:

1. **Backup production data** for development
2. **Create baseline test data**
3. **Share data states** between team members

```bash
# Capture current state
bun run seed snapshot current-state

# Capture specific tables
bun run seed snapshot user-data users,profiles

# The snapshot creates both:
# - SQL file: src/seed/snapshots/current-state-2024-01-01T12-00-00.sql
# - Seed file: src/seed/scripts/current-state-2024-01-01T12-00-00.ts
```

## Integration with Migrations

Combine seeding with your migration workflow:

```bash
# 1. Run migrations
bun run db:migrate

# 2. Seed the database
bun run seed run

# 3. Or combine with specific seeds for different environments
bun run seed run essential-data  # Always run
bun run seed run test-data       # Only in development
```

## Troubleshooting

### Common Issues

1. **"Seed file not found"**
   - Make sure the seed file is in `src/seed/scripts/`
   - Check the file name matches exactly

2. **"Invalid seed module"**
   - Ensure your seed exports both `config` and `seed`
   - Check for syntax errors in your seed file

3. **"No organization found"**
   - Check seed dependencies
   - Run prerequisite seeds first

4. **Unique constraint violations**
   - Make your seeds idempotent
   - Check for existing data before inserting

### Debug Mode

Run seeds with detailed output:

```bash
# The CLI already provides detailed output
bun run seed run my-seed
```

## File Structure

```
src/seed/
├── index.ts              # Core seeding infrastructure
├── cli.ts                # Command-line interface
├── generate.ts           # Seed generator
├── README.md             # This file
├── scripts/              # Your seed files
│   ├── users.ts
│   ├── organizations.ts
│   └── test-data.ts
├── snapshots/            # Database snapshots
│   ├── prod-backup-2024-01-01.sql
│   └── test-state-2024-01-02.sql
└── templates/            # Seed templates
    ├── basic-seed.template.ts
    └── advanced-seed.template.ts
```

## Contributing

When adding new features to the seeding system:

1. Update the templates if needed
2. Add new CLI commands to `cli.ts`
3. Update this README
4. Add tests for new functionality 