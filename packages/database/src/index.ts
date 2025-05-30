// Export database connection and pool management
export {
  db,
  getDb,
  getClient,
  initializePool,
  closePool,
  type PoolConfig,
} from '@/connection';

// Export migration utilities
export { runMigrations, runMigrationsAndClose } from '@/migrate';

// Export setup utilities for existing databases
export { setupExistingDatabase, generateSnapshot, validateSchema } from '@/setup';

// Export introspected schema and types
export * from '@/schema';

// Export relations
export * from '@/relations';

export * from '@/helpers';

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
