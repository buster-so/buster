// Export database connection and pool management
export {
  db,
  getDb,
  getClient,
  initializePool,
  closePool,
  type PoolConfig,
} from './connection';

// Export migration utilities (commented out until migrate.ts exists)
// export { runMigrations, runMigrationsAndClose } from './migrate';

// Export introspected schema and types
export * from './schema';

// Export relations
export * from './relations';

// Export database helpers
export * from './helpers';

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
} from 'drizzle-orm';
