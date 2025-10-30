/**
 * Re-export validate-private-key utilities from database package
 * This avoids circular dependencies between @buster/database and @buster/data-source
 */
export { PrivateKeySchema, validatePrivateKey } from '@buster/database/schema-types';
