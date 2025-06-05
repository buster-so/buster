# Diesel to Drizzle Migration Guide

This document describes the successful migration from Diesel migrations to Drizzle SQL migrations.

## ✅ Migration Status: COMPLETE

We've successfully converted **70 Diesel migrations** from the `api/migrations/` directory to **Drizzle SQL migrations** with proper numeric naming convention that work with `drizzle-kit migrate`.

## Migration Structure

### Before (Diesel)
- Location: `api/migrations/`
- Format: Directory-based with `up.sql` and `down.sql`
- Naming: `YYYY-MM-DD-HHMMSS_migration_name/`
- Runner: Custom Rust-based migration runner

### After (Drizzle)
- Location: `packages/database/drizzle/`
- Format: Single SQL files with proper metadata structure
- Naming: `0001_migration_name.sql`, `0002_migration_name.sql`, etc.
- Runner: `drizzle-kit migrate`
- Metadata: `drizzle/meta/_journal.json` (Drizzle Kit format)

## Converted Migrations

All 70 migrations have been converted and numbered sequentially:

- `0001_create_organizations.sql` (from 2024-06-03-034617_create_organizations)
- `0002_create_users.sql` (from 2024-06-03-034618_create_users)
- ...
- `0070_create_metric_files_to_datasets_join_table.sql` (from 2025-04-29-223855_create_metric_files_to_datasets_join_table)

Each migration file includes:
- Header comments with original migration info
- Clean SQL without Diesel-specific comments
- Only the "up" migration (Drizzle doesn't use down migrations)

## ✅ Created Files & Structure

### Migration Files
- **70 SQL migration files** in `drizzle/` (0001-0070)
- **`drizzle/meta/_journal.json`** - Drizzle Kit migration metadata (proper format)

### Schema & Relations
- **`src/schema.ts`** - Complete Drizzle schema (1775 lines, all tables/enums)  
- **`src/relations.ts`** - Drizzle relations (700 lines, all relationships)

### Conversion Scripts
- **`scripts/convert-diesel-migrations.ts`** - Converts Diesel to Drizzle SQL
- **`scripts/convert-seed-data.ts`** - Converts seed.sql to TypeScript

### Setup Infrastructure
- **`src/setup.ts`** - Main setup CLI using drizzle-kit
- **`src/setup-data.ts`** - Auth user and vault setup
- **`src/seed-data.ts`** - Generated seed data functions
- **`src/connection.ts`** - Database connection with pooling

### Configuration
- **`drizzle.config.ts`** - Drizzle Kit configuration
- **`package.json`** - Updated scripts for Drizzle workflow

## Usage

### Prerequisites
Set up your database connection:
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### Run Migrations
```bash
# Using drizzle-kit directly (recommended)
bun run db:migrate

# Using our setup script (includes setup data + seed)
bun run setup:full

# Just migrations
bun run src/setup.ts migrate
```

### Available Commands

#### Drizzle Commands
- `bun run db:migrate` - Run pending migrations
- `bun run db:generate` - Generate new migration from schema changes
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:push` - Push schema changes directly (dev only)

#### Setup Commands
- `bun run setup:full` - Complete database setup
- `bun run setup:data` - Auth users and vault setup only
- `bun run setup:seed` - Seed data only

#### Conversion Commands (One-time use - already completed)
- `bun run convert:migrations` - Convert Diesel to Drizzle ✅ DONE
- `bun run convert:seed` - Convert seed.sql to TypeScript ✅ DONE

## File Structure (Final)

```
packages/database/
├── drizzle/                    # ✅ Drizzle migrations (ready)
│   ├── meta/
│   │   └── _journal.json       # ✅ Drizzle Kit metadata
│   ├── 0001_create_organizations.sql
│   ├── 0002_create_users.sql
│   ├── ...
│   └── 0070_create_metric_files_to_datasets_join_table.sql
├── scripts/                    # ✅ Conversion tools (completed)
│   ├── convert-diesel-migrations.ts
│   └── convert-seed-data.ts
├── src/                        # ✅ Drizzle infrastructure
│   ├── schema.ts               # ✅ 1775 lines - complete schema
│   ├── relations.ts            # ✅ 700 lines - all relationships  
│   ├── connection.ts           # ✅ Database connection with pooling
│   ├── setup.ts                # ✅ Setup CLI with drizzle-kit
│   ├── setup-data.ts           # ✅ Auth/vault setup
│   └── seed-data.ts            # ✅ Generated seed functions
├── drizzle.config.ts           # ✅ Drizzle Kit configuration
└── package.json                # ✅ Updated scripts
```

## Migration Benefits Achieved

### ✅ Drizzle Advantages
✅ **Standard tooling** - Uses drizzle-kit migrate  
✅ **Better integration** - Works seamlessly with Drizzle ORM  
✅ **Simpler format** - Single SQL files instead of directories  
✅ **Version control friendly** - Linear numbering system  
✅ **TypeScript-first** - Generated types from schema  
✅ **Proper metadata** - Drizzle Kit compatible journal format

### ✅ Conversion Results
✅ **All 70 migrations converted** successfully  
✅ **Proper numeric naming** (0001, 0002, etc.)  
✅ **Clean SQL format** with metadata headers  
✅ **Drizzle metadata** generated correctly (`meta/_journal.json`)  
✅ **Seed data converted** to TypeScript functions  
✅ **Complete schema & relations** preserved  
✅ **Database connection** with pooling ready  

## Testing & Deployment

The migration system is ready for use:

1. **Set DATABASE_URL** environment variable
2. **Run migrations**: `bun run db:migrate`
3. **Verify with Drizzle Studio**: `bun run db:studio`

## 🎉 Migration Complete!

The Diesel to Drizzle migration is **100% complete** with all infrastructure ready for production use. All 70 migrations have been successfully converted to the proper Drizzle format with correct metadata structure. 