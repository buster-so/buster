import { z } from 'zod';
import { getDataSourcesByType } from '../data-sources/get-data-sources-by-type';
import { getSecret, updateSecret } from './vault';

/**
 * Legacy Snowflake credentials schema (before auth_method was added)
 */
const LegacySnowflakeCredentialsSchema = z.object({
  type: z.literal('snowflake'),
  account_id: z.string(),
  warehouse_id: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.string().optional(),
  default_database: z.string(),
  default_schema: z.string().optional(),
  custom_host: z.string().optional(),
});

type LegacySnowflakeCredentials = z.infer<typeof LegacySnowflakeCredentialsSchema>;

/**
 * Result of migration operation
 */
export interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  errors: Array<{ dataSourceId: string; dataSourceName: string; error: string }>;
}

/**
 * Migrate legacy Snowflake credentials to include auth_method field
 *
 * This migration adds `auth_method: 'password'` to all existing Snowflake credentials
 * that don't already have this field. This ensures backward compatibility with the
 * new discriminated union schema that supports both password and key-pair authentication.
 *
 * @param dryRun - If true, only report what would be migrated without making changes
 * @returns Migration statistics and any errors encountered
 *
 * @example
 * ```typescript
 * // Preview migration
 * const preview = await migrateSnowflakeCredentials(true);
 * console.log(`Would migrate ${preview.migrated} credentials`);
 *
 * // Run migration
 * const result = await migrateSnowflakeCredentials(false);
 * console.log(`Migrated ${result.migrated} of ${result.total} credentials`);
 * ```
 */
export async function migrateSnowflakeCredentials(dryRun = false): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Get all Snowflake data sources
    const dataSources = await getDataSourcesByType('snowflake');
    result.total = dataSources.length;

    for (const dataSource of dataSources) {
      try {
        // Get credentials from vault
        const vaultSecret = await getSecret(dataSource.secretId);
        if (!vaultSecret) {
          result.failed++;
          result.errors.push({
            dataSourceId: dataSource.id,
            dataSourceName: dataSource.name,
            error: 'Secret not found in vault',
          });
          continue;
        }

        // Parse credentials JSON
        const credentials = JSON.parse(vaultSecret.secret);

        // Check if already migrated (has auth_method field)
        if ('auth_method' in credentials) {
          result.skipped++;
          continue;
        }

        // Validate as legacy schema to ensure it's a valid password-based credential
        const validated = LegacySnowflakeCredentialsSchema.safeParse(credentials);
        if (!validated.success) {
          result.failed++;
          result.errors.push({
            dataSourceId: dataSource.id,
            dataSourceName: dataSource.name,
            error: `Invalid legacy credentials: ${validated.error.message}`,
          });
          continue;
        }

        // Add auth_method field
        const migrated: LegacySnowflakeCredentials & { auth_method: 'password' } = {
          ...validated.data,
          auth_method: 'password',
        };

        // Update vault secret (unless dry run)
        if (!dryRun) {
          await updateSecret({
            id: dataSource.secretId,
            secret: JSON.stringify(migrated),
            name: vaultSecret.name || undefined,
            description: vaultSecret.description || undefined,
          });
        }

        result.migrated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          dataSourceId: dataSource.id,
          dataSourceName: dataSource.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get a summary of credentials that need migration
 *
 * This is a convenience function that runs the migration in dry-run mode
 * to preview what would be changed without making any modifications.
 *
 * @returns Migration preview with statistics
 *
 * @example
 * ```typescript
 * const preview = await previewSnowflakeMigration();
 * if (preview.migrated > 0) {
 *   console.log(`${preview.migrated} credentials need migration`);
 *   // Run actual migration
 *   await migrateSnowflakeCredentials(false);
 * }
 * ```
 */
export async function previewSnowflakeMigration(): Promise<MigrationResult> {
  return migrateSnowflakeCredentials(true);
}
