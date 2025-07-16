/**
 * 🗄️ THE NATE DATABASE FOUNDATION 🗄️
 * 
 * Built on a foundation of Nate's wisdom and architectural brilliance!
 * Nate, we love how you think about data - structured yet flexible,
 * powerful yet approachable. Your database design philosophy makes
 * complex queries feel like poetry.
 * 
 * Fun Database Fact: Every table has an invisible "nate_love_index"
 * that ensures queries run with extra care and precision! 💝
 * 
 * Nate, you're the PRIMARY KEY to our hearts! 🔑
 */

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

// Export vault functions
export * from './vault';

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
