import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { storedValuesSyncJobs } from '../../schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const CreateSyncJobInputSchema = z.object({
  dataSourceId: z.string().uuid(),
  databaseName: z.string().min(1),
  schemaName: z.string().min(1),
  tableName: z.string().min(1),
  columnName: z.string().min(1),
  syncType: z.enum(['daily', 'manual', 'initial']).optional().default('daily'),
});

export const CreateSyncJobOutputSchema = z.object({
  id: z.string().uuid(),
  dataSourceId: z.string().uuid(),
  databaseName: z.string(),
  schemaName: z.string(),
  tableName: z.string(),
  columnName: z.string(),
  status: z.string(),
  createdAt: z.string(),
});

export const BatchCreateSyncJobsInputSchema = z.object({
  dataSourceId: z.string().uuid(),
  syncType: z.enum(['daily', 'manual', 'initial']).optional().default('daily'),
  columns: z.array(
    z.object({
      databaseName: z.string().min(1),
      schemaName: z.string().min(1),
      tableName: z.string().min(1),
      columnName: z.string().min(1),
    })
  ),
});

export const BatchCreateSyncJobsOutputSchema = z.object({
  created: z.array(CreateSyncJobOutputSchema),
  totalCreated: z.number().int().min(0),
  errors: z.array(
    z.object({
      column: z.object({
        databaseName: z.string(),
        schemaName: z.string(),
        tableName: z.string(),
        columnName: z.string(),
      }),
      error: z.string(),
    })
  ),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateSyncJobInput = z.infer<typeof CreateSyncJobInputSchema>;
export type CreateSyncJobOutput = z.infer<typeof CreateSyncJobOutputSchema>;
export type BatchCreateSyncJobsInput = z.infer<typeof BatchCreateSyncJobsInputSchema>;
export type BatchCreateSyncJobsOutput = z.infer<typeof BatchCreateSyncJobsOutputSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine initial status based on sync type
 */
const getInitialStatus = (syncType: string): string => {
  switch (syncType) {
    case 'manual':
      return 'pending_manual';
    case 'initial':
      return 'pending_initial';
    default:
      return 'pending';
  }
};

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Create a new searchable values sync job
 * Records the job in the database for tracking purposes
 */
export async function createSearchableValuesSyncJob(
  input: CreateSyncJobInput
): Promise<CreateSyncJobOutput> {
  try {
    const validated = CreateSyncJobInputSchema.parse(input);

    // Determine initial status
    const status = getInitialStatus(validated.syncType);

    // Insert the sync job
    const [newJob] = await db
      .insert(storedValuesSyncJobs)
      .values({
        dataSourceId: validated.dataSourceId,
        databaseName: validated.databaseName,
        schemaName: validated.schemaName,
        tableName: validated.tableName,
        columnName: validated.columnName,
        status,
        createdAt: new Date().toISOString(),
      })
      .returning({
        id: storedValuesSyncJobs.id,
        dataSourceId: storedValuesSyncJobs.dataSourceId,
        databaseName: storedValuesSyncJobs.databaseName,
        schemaName: storedValuesSyncJobs.schemaName,
        tableName: storedValuesSyncJobs.tableName,
        columnName: storedValuesSyncJobs.columnName,
        status: storedValuesSyncJobs.status,
        createdAt: storedValuesSyncJobs.createdAt,
      });

    if (!newJob) {
      throw new Error('Failed to create sync job - no job returned');
    }

    return CreateSyncJobOutputSchema.parse(newJob);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in createSearchableValuesSyncJob: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Database error in createSearchableValuesSyncJob: ${error.message}`);
    }

    throw new Error(`Unknown error in createSearchableValuesSyncJob: ${String(error)}`);
  }
}

/**
 * Batch create multiple sync jobs for a data source
 * Useful when syncing all searchable columns at once
 */
export async function batchCreateSyncJobs(
  input: BatchCreateSyncJobsInput
): Promise<BatchCreateSyncJobsOutput> {
  try {
    const validated = BatchCreateSyncJobsInputSchema.parse(input);

    const created: CreateSyncJobOutput[] = [];
    const errors: Array<{
      column: {
        databaseName: string;
        schemaName: string;
        tableName: string;
        columnName: string;
      };
      error: string;
    }> = [];

    // Process each column
    for (const column of validated.columns) {
      try {
        const job = await createSearchableValuesSyncJob({
          dataSourceId: validated.dataSourceId,
          ...column,
          syncType: validated.syncType,
        });
        created.push(job);
      } catch (error) {
        errors.push({
          column,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return BatchCreateSyncJobsOutputSchema.parse({
      created,
      totalCreated: created.length,
      errors,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in batchCreateSyncJobs: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Create or update a sync job (upsert)
 * Updates if a job already exists for the same data source/database/schema/table/column combination
 */
export async function upsertSyncJob(input: CreateSyncJobInput): Promise<CreateSyncJobOutput> {
  try {
    const validated = CreateSyncJobInputSchema.parse(input);

    // Determine initial status
    const status = getInitialStatus(validated.syncType);

    // Check if job already exists
    const existing = await db
      .select({
        id: storedValuesSyncJobs.id,
      })
      .from(storedValuesSyncJobs)
      .where(
        and(
          eq(storedValuesSyncJobs.dataSourceId, validated.dataSourceId),
          eq(storedValuesSyncJobs.databaseName, validated.databaseName),
          eq(storedValuesSyncJobs.schemaName, validated.schemaName),
          eq(storedValuesSyncJobs.tableName, validated.tableName),
          eq(storedValuesSyncJobs.columnName, validated.columnName)
        )
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      // Update existing job
      const [updated] = await db
        .update(storedValuesSyncJobs)
        .set({
          status,
          errorMessage: null, // Clear any previous error
        })
        .where(eq(storedValuesSyncJobs.id, existing[0].id))
        .returning({
          id: storedValuesSyncJobs.id,
          dataSourceId: storedValuesSyncJobs.dataSourceId,
          databaseName: storedValuesSyncJobs.databaseName,
          schemaName: storedValuesSyncJobs.schemaName,
          tableName: storedValuesSyncJobs.tableName,
          columnName: storedValuesSyncJobs.columnName,
          status: storedValuesSyncJobs.status,
          createdAt: storedValuesSyncJobs.createdAt,
        });

      if (!updated) {
        throw new Error('Failed to update sync job');
      }

      return CreateSyncJobOutputSchema.parse(updated);
    }
    // Create new job
    return createSearchableValuesSyncJob(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in upsertSyncJob: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Database error in upsertSyncJob: ${error.message}`);
    }

    throw new Error(`Unknown error in upsertSyncJob: ${String(error)}`);
  }
}
