# Diesel to Drizzle Migration Plan

## Overview
This document outlines the strategy to migrate from Diesel (Rust) to Drizzle (TypeScript) while maintaining system stability and avoiding downtime.

## Current State
- **Rust API**: Uses Diesel with 60+ migrations in `api/migrations/`
- **TypeScript Database Package**: Has Drizzle with complete schema but no migration history
- **Database**: PostgreSQL with existing data and `__diesel_schema_migrations` table

## Migration Strategy: Phased Approach

### Phase 1: Baseline Drizzle Migration (Safe Start)
**Goal**: Generate a baseline Drizzle migration that represents the current database state.

#### Step 1: Generate Current State Migration
```bash
cd packages/database
bun run db:pull  # This introspects the current database
bun run db:generate --name baseline_from_diesel
```

This creates a migration file that captures the current state of your database as managed by Diesel.

#### Step 2: Mark as Applied (Without Running)
Since the database already exists, we need to mark this baseline migration as applied without actually running it:

```bash
# This will be implemented in the migration script
bun run db:baseline
```

### Phase 2: Parallel Operation Period
**Goal**: Run both Diesel and Drizzle side-by-side to ensure compatibility.

#### Step 1: Update CI/CD for Dual Operations
- Keep Diesel migrations running in deployment pipeline
- Add Drizzle migration checks (but don't apply yet)
- Ensure both systems see the same schema

#### Step 2: Integration Testing
- Add tests that verify both Diesel and Drizzle can read/write to the same database
- Ensure no schema drift between the two systems

### Phase 3: Migration Implementation
**Goal**: Create the actual migration tooling.

#### Step 1: Create Migration Bridge
Create a script that:
1. Reads the latest Diesel migration state
2. Generates corresponding Drizzle migrations
3. Handles the transition period

#### Step 2: Database State Synchronization
Ensure the `__diesel_schema_migrations` table is properly handled during transition.

### Phase 4: Cutover
**Goal**: Switch from Diesel to Drizzle as the primary migration system.

#### Step 1: Final Migration Sync
- Apply any pending Diesel migrations
- Generate final Drizzle state
- Create transition migration

#### Step 2: Update Deployment Pipeline
- Replace Diesel migration commands with Drizzle
- Update all CI/CD workflows
- Update documentation

## Detailed Implementation Steps

### 1. Generate Baseline Migration

```bash
# In packages/database directory
bun run db:pull  # Introspect current database
bun run db:generate --name "baseline_diesel_to_drizzle_migration"
```

### 2. Create Custom Baseline Script

Create `packages/database/src/baseline.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

// Mark baseline migration as applied without running it
async function markBaselineAsApplied() {
  // Implementation to mark the baseline migration as applied
  // This prevents running the baseline migration on existing database
}
```

### 3. Update Package Scripts

Add to `packages/database/package.json`:

```json
{
  "scripts": {
    "db:baseline": "bun run src/baseline.ts",
    "db:diesel-sync": "bun run src/diesel-sync.ts",
    "db:transition": "bun run src/transition.ts"
  }
}
```

### 4. Migration Validation

Create validation scripts to ensure:
- Schema consistency between Diesel and Drizzle
- Migration state synchronization
- No data loss during transition

## Risk Mitigation

### Backup Strategy
1. **Full Database Backup**: Before any migration steps
2. **Migration State Backup**: Save current `__diesel_schema_migrations` table
3. **Rollback Plan**: Document exact steps to revert to Diesel

### Testing Strategy
1. **Local Testing**: Test entire migration on local copy of production database
2. **Staging Environment**: Full end-to-end testing in staging
3. **Canary Deployment**: Gradual rollout with monitoring

### Monitoring
1. **Migration State Tracking**: Monitor both Diesel and Drizzle migration tables
2. **Schema Drift Detection**: Automated checks for schema differences
3. **Performance Monitoring**: Ensure no performance regression

## Timeline

### Week 1: Setup and Baseline
- [ ] Generate baseline Drizzle migration
- [ ] Create baseline marking script
- [ ] Local testing and validation

### Week 2: Parallel System Setup
- [ ] Update CI/CD for dual operations
- [ ] Create integration tests
- [ ] Staging environment testing

### Week 3: Migration Tooling
- [ ] Create migration bridge scripts
- [ ] Implement state synchronization
- [ ] End-to-end testing

### Week 4: Production Cutover
- [ ] Final migration sync
- [ ] Update deployment pipeline
- [ ] Documentation updates
- [ ] Post-migration monitoring

## Success Criteria

- [ ] All existing Diesel migrations are preserved in history
- [ ] New Drizzle migrations work correctly
- [ ] No data loss or corruption
- [ ] CI/CD pipeline updated successfully
- [ ] Development team trained on new workflow
- [ ] Documentation updated
- [ ] Performance maintained or improved

## Rollback Plan

If issues arise during migration:

1. **Stop all deployments**
2. **Restore from backup** if data corruption occurred
3. **Revert CI/CD changes** to use Diesel
4. **Document issues** and create fix plan
5. **Schedule retry** after addressing root causes

## Next Steps

1. Review this plan with the team
2. Set up local testing environment
3. Generate baseline migration
4. Begin Phase 1 implementation

---

**Note**: This is a living document. Update as implementation progresses and new requirements emerge. 