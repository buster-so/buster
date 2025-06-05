# Diesel to Drizzle Migration - Step by Step Guide

## Phase 1: Preparation and Baseline Setup

### Step 1: Install Dependencies
```bash
cd packages/database
bun install
```

### Step 2: Generate Baseline Migration from Current Database
```bash
# Make sure your DATABASE_URL is set to your current database
export DATABASE_URL="postgresql://username:password@host:port/database"

# Generate the baseline migration that captures current state
bun run db:pull
bun run db:generate --name baseline_from_diesel
```

This will create a migration file in `drizzle/` directory that represents your current database schema.

### Step 3: Mark Baseline as Applied (without running it)
```bash
# This marks the baseline migration as applied without actually running the SQL
# since your database already has all the tables
bun run db:baseline
```

### Step 4: Validate the Setup
```bash
bun run db:baseline-validate
```

Expected output:
```
✅ Diesel migrations: [number]
✅ Drizzle migrations: 1
✅ Baseline validation successful
```

## Phase 2: Test the Migration System

### Step 5: Test Schema Change
Make a small test change to verify the system works:

1. Edit `src/schema.ts` - add a test column to a table:
```typescript
// In the messages table, add a test column
export const messages = pgTable(
  'messages',
  {
    // ... existing columns ...
    testColumn: text('test_column'), // Add this line
  },
  // ... rest of table definition
);
```

2. Generate migration:
```bash
bun run db:generate --name test_column_addition
```

3. Review the generated migration file in `drizzle/` directory

4. Apply the migration:
```bash
bun run db:migrate
```

5. Verify in database that the column was added

6. Remove the test column and create a removal migration:
```typescript
// Remove the testColumn line from src/schema.ts
```

```bash
bun run db:generate --name remove_test_column
bun run db:migrate
```

## Phase 3: Parallel Operation Setup

### Step 6: Update CI/CD for Parallel Operations

1. **Backup current CI/CD workflows** that use Diesel

2. **Modify deployment workflows** to run both systems:

Example GitHub Actions update for `.github/workflows/porter_app_staging_3155.yml`:

```yaml
# Add after Diesel migration step
- name: Validate Drizzle Migration State
  working-directory: ./packages/database
  run: |
    bun install
    bun run db:baseline-validate
  env:
    DATABASE_URL: ${{ secrets.DB_URL }}

# Optional: Add Drizzle migration check (don't apply yet)
- name: Check Drizzle Migrations
  working-directory: ./packages/database
  run: bun run db:check
  env:
    DATABASE_URL: ${{ secrets.DB_URL }}
```

### Step 7: Create Integration Tests

Create `packages/database/tests/migration-compatibility.test.ts`:

```typescript
import { test, expect } from 'bun:test';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

test('Both Diesel and Drizzle see same schema', async () => {
  // Check that both migration systems report consistent state
  const dieselMigrations = await sql`
    SELECT COUNT(*) FROM public.__diesel_schema_migrations;
  `;
  
  const drizzleMigrations = await sql`
    SELECT COUNT(*) FROM drizzle.__drizzle_migrations;
  `;
  
  expect(Number(dieselMigrations[0].count)).toBeGreaterThan(0);
  expect(Number(drizzleMigrations[0].count)).toBeGreaterThan(0);
  
  await sql.end();
});
```

Run the test:
```bash
bun test tests/migration-compatibility.test.ts
```

## Phase 4: Production Preparation

### Step 8: Create Production Migration Plan

1. **Schedule maintenance window** (optional, for extra safety)

2. **Create database backup script**:
```bash
# Create backup before migration
pg_dump $DATABASE_URL > pre-drizzle-migration-backup.sql
```

3. **Test on staging environment** that mirrors production

### Step 9: Prepare Rollback Plan

Document rollback steps in case of issues:

1. Stop all deployments
2. Restore from backup if needed
3. Revert CI/CD to use only Diesel
4. Remove Drizzle migration tables if necessary

## Phase 5: Production Cutover

### Step 10: Execute Production Migration

1. **Apply any pending Diesel migrations first**:
```bash
cd api
diesel migration run
```

2. **Run Drizzle baseline setup**:
```bash
cd packages/database
bun run db:baseline
bun run db:baseline-validate
```

3. **Update CI/CD to use Drizzle**:
   - Replace `diesel migration run` with `bun run db:migrate`
   - Update working directory to `packages/database`
   - Ensure `DATABASE_URL` is available

### Step 11: Update GitHub Actions Workflows

Replace in `.github/workflows/porter_app_staging_3155.yml` and `porter_app_main_3155.yml`:

```yaml
# Replace this section:
- name: Install Diesel CLI
  run: cargo install diesel_cli --no-default-features --features postgres

- name: Run migrations
  working-directory: ./api
  run: diesel migration run
  env:
    DATABASE_URL: ${{ secrets.DB_URL }}

# With this:
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest

- name: Install dependencies
  working-directory: ./packages/database
  run: bun install

- name: Run migrations
  working-directory: ./packages/database
  run: bun run db:migrate
  env:
    DATABASE_URL: ${{ secrets.DB_URL }}
```

### Step 12: Post-Migration Verification

1. **Monitor application health** after deployment
2. **Verify new migrations work** by making a small schema change
3. **Check logs** for any migration-related errors
4. **Test database operations** through the application

## Phase 6: Cleanup

### Step 13: Remove Diesel Dependencies (Later)

After confirming everything works well:

1. Remove Diesel from `api/Cargo.toml`
2. Remove `api/migrations/` directory (after archiving)
3. Remove `api/diesel.toml`
4. Update documentation

### Step 14: Update Team Documentation

1. Update development setup instructions
2. Document new migration workflow
3. Update deployment procedures
4. Train team on Drizzle CLI commands

## Common Commands Reference

### Development Workflow
```bash
# Make schema changes in src/schema.ts
# Generate migration
bun run db:generate --name descriptive_migration_name

# Review generated migration in drizzle/ directory
# Apply migration
bun run db:migrate

# Open database studio for inspection
bun run db:studio
```

### Troubleshooting
```bash
# Check migration status
bun run db:check

# Validate baseline setup
bun run db:baseline-validate

# Pull latest schema from database
bun run db:pull

# Push schema changes directly (development only)
bun run db:push
```

## Success Criteria Checklist

- [ ] Baseline migration created and marked as applied
- [ ] Test migration works (add/remove column)
- [ ] Integration tests pass
- [ ] Staging environment migrated successfully
- [ ] CI/CD updated to use Drizzle
- [ ] Production migration completed without data loss
- [ ] New migrations work correctly
- [ ] Team trained on new workflow
- [ ] Documentation updated

## Emergency Contacts

If issues arise during migration:
- Database Administrator: [contact]
- DevOps Team: [contact]
- Development Lead: [contact]

---

**Important**: Always test each step thoroughly in a non-production environment first! 