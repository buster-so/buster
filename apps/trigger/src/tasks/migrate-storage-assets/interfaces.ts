import { z } from 'zod';

// Input schema for the migration task
export const MigrateStorageAssetsInputSchema = z.object({
  integrationId: z.string().uuid('Integration ID must be a valid UUID'),
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
});

export type MigrateStorageAssetsInput = z.infer<typeof MigrateStorageAssetsInputSchema>;

// Output schema for the migration task
export const MigrateStorageAssetsOutputSchema = z.object({
  success: z.boolean(),
  totalAssets: z.number(),
  migratedAssets: z.number(),
  failedAssets: z.number(),
  errors: z
    .array(
      z.object({
        key: z.string(),
        error: z.string(),
      })
    )
    .optional(),
  executionTimeMs: z.number(),
});

export type MigrateStorageAssetsOutput = z.infer<typeof MigrateStorageAssetsOutputSchema>;
