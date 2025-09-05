// Export database connection and pool management
export * from './connection';

// Export migration utilities (commented out until migrate.ts exists)
// export { runMigrations, runMigrationsAndClose } from './migrate';

// Export introspected schema and types
export * from './schema';

// Export relations
export * from './relations';

// Export database helpers
export * from './queries';

// Export error parsing utilities
export { parseDatabaseError, getErrorHint, type ParsedDatabaseError } from './helpers/error-parser';

// Export vault functions
export * from './vault';

// Export schema types
export * from './schema-types';

// Export message schemas
export * from './schemas/message-schemas';

// Export common Drizzle utilities
export {
  eq,
  and,
  or,
  not,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  exists,
  notExists,
  desc,
  asc,
  sql,
  count,
  gt,
  lt,
  gte,
  lte,
} from 'drizzle-orm';
