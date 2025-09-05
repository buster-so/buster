import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dataSources, storedValuesSyncJobs } from '../../schema';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const GetExistingSyncJobsInputSchema = z.object({
  statuses: z
    .array(z.string())
    .optional()
    .default(['pending', 'pending_manual', 'pending_initial', 'failed']),
  limit: z.number().int().min(1).optional(),
});

export const ExistingSyncJobSchema = z.object({
  id: z.string().uuid(),
  dataSourceId: z.string().uuid(),
  dataSourceName: z.string(),
  dataSourceType: z.string(),
  organizationId: z.string().uuid(),
  databaseName: z.string(),
  schemaName: z.string(),
  tableName: z.string(),
  columnName: z.string(),
  status: z.string(),
  errorMessage: z.string().nullable(),
  lastSyncedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const GetExistingSyncJobsOutputSchema = z.object({
  syncJobs: z.array(ExistingSyncJobSchema),
  totalCount: z.number().int().min(0),
  byDataSource: z.record(
    z.string().uuid(),
    z.object({
      dataSourceId: z.string().uuid(),
      dataSourceName: z.string(),
      dataSourceType: z.string(),
      organizationId: z.string().uuid(),
      jobCount: z.number().int().min(0),
      jobs: z.array(ExistingSyncJobSchema),
    })
  ),
});

// ============================================================================
// TYPES
// ============================================================================

export type GetExistingSyncJobsInput = z.infer<typeof GetExistingSyncJobsInputSchema>;
export type ExistingSyncJob = z.infer<typeof ExistingSyncJobSchema>;
export type GetExistingSyncJobsOutput = z.infer<typeof GetExistingSyncJobsOutputSchema>;

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get existing sync jobs that need to be processed
 * Returns jobs from the stored_values_sync_jobs table grouped by data source
 */
export async function getExistingSyncJobs(
  input: Partial<GetExistingSyncJobsInput> = {}
): Promise<GetExistingSyncJobsOutput> {
  try {
    const validated = GetExistingSyncJobsInputSchema.parse(input);

    // Build the query to get existing sync jobs with their data source info
    const baseQuery = db
      .select({
        id: storedValuesSyncJobs.id,
        dataSourceId: storedValuesSyncJobs.dataSourceId,
        dataSourceName: dataSources.name,
        dataSourceType: dataSources.type,
        organizationId: dataSources.organizationId,
        databaseName: storedValuesSyncJobs.databaseName,
        schemaName: storedValuesSyncJobs.schemaName,
        tableName: storedValuesSyncJobs.tableName,
        columnName: storedValuesSyncJobs.columnName,
        status: storedValuesSyncJobs.status,
        errorMessage: storedValuesSyncJobs.errorMessage,
        lastSyncedAt: storedValuesSyncJobs.lastSyncedAt,
        createdAt: storedValuesSyncJobs.createdAt,
      })
      .from(storedValuesSyncJobs)
      .innerJoin(dataSources, eq(dataSources.id, storedValuesSyncJobs.dataSourceId))
      .where(
        and(
          // Only get jobs with specified statuses
          inArray(storedValuesSyncJobs.status, validated.statuses),
          // Only active data sources
          isNull(dataSources.deletedAt)
        )
      );

    // Add limit if specified
    const query = validated.limit ? baseQuery.limit(validated.limit) : baseQuery;

    const syncJobs = await query;

    // Transform the results
    const formattedJobs: ExistingSyncJob[] = syncJobs.map((job) => ({
      ...job,
      lastSyncedAt: job.lastSyncedAt ? new Date(job.lastSyncedAt).toISOString() : null,
      createdAt: new Date(job.createdAt).toISOString(),
    }));

    // Group jobs by data source
    const byDataSource: Record<
      string,
      {
        dataSourceId: string;
        dataSourceName: string;
        dataSourceType: string;
        organizationId: string;
        jobCount: number;
        jobs: ExistingSyncJob[];
      }
    > = {};

    for (const job of formattedJobs) {
      if (!byDataSource[job.dataSourceId]) {
        byDataSource[job.dataSourceId] = {
          dataSourceId: job.dataSourceId,
          dataSourceName: job.dataSourceName,
          dataSourceType: job.dataSourceType,
          organizationId: job.organizationId,
          jobCount: 0,
          jobs: [],
        };
      }
      const dataSourceInfo = byDataSource[job.dataSourceId];
      if (dataSourceInfo) {
        dataSourceInfo.jobs.push(job);
        dataSourceInfo.jobCount++;
      }
    }

    return GetExistingSyncJobsOutputSchema.parse({
      syncJobs: formattedJobs,
      totalCount: formattedJobs.length,
      byDataSource,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error in getExistingSyncJobs: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Database error in getExistingSyncJobs: ${error.message}`);
    }

    throw new Error(`Unknown error in getExistingSyncJobs: ${String(error)}`);
  }
}

/**
 * Get sync jobs for a specific data source
 * Useful for processing jobs per data source
 */
export async function getSyncJobsForDataSource(
  dataSourceId: string,
  statuses: string[] = ['pending', 'pending_manual', 'pending_initial', 'failed']
): Promise<ExistingSyncJob[]> {
  try {
    const validatedId = z.string().uuid().parse(dataSourceId);

    const jobs = await db
      .select({
        id: storedValuesSyncJobs.id,
        dataSourceId: storedValuesSyncJobs.dataSourceId,
        dataSourceName: dataSources.name,
        dataSourceType: dataSources.type,
        organizationId: dataSources.organizationId,
        databaseName: storedValuesSyncJobs.databaseName,
        schemaName: storedValuesSyncJobs.schemaName,
        tableName: storedValuesSyncJobs.tableName,
        columnName: storedValuesSyncJobs.columnName,
        status: storedValuesSyncJobs.status,
        errorMessage: storedValuesSyncJobs.errorMessage,
        lastSyncedAt: storedValuesSyncJobs.lastSyncedAt,
        createdAt: storedValuesSyncJobs.createdAt,
      })
      .from(storedValuesSyncJobs)
      .innerJoin(dataSources, eq(dataSources.id, storedValuesSyncJobs.dataSourceId))
      .where(
        and(
          eq(storedValuesSyncJobs.dataSourceId, validatedId),
          inArray(storedValuesSyncJobs.status, statuses),
          isNull(dataSources.deletedAt)
        )
      );

    return jobs.map((job) => ({
      ...job,
      lastSyncedAt: job.lastSyncedAt ? new Date(job.lastSyncedAt).toISOString() : null,
      createdAt: new Date(job.createdAt).toISOString(),
    }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid dataSourceId: ${error.message}`);
    }

    if (error instanceof Error) {
      throw new Error(`Database error in getSyncJobsForDataSource: ${error.message}`);
    }

    throw new Error(`Unknown error in getSyncJobsForDataSource: ${String(error)}`);
  }
}

/**
 * Count pending sync jobs
 * Useful for monitoring and reporting
 */
export async function countPendingSyncJobs(): Promise<number> {
  try {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(storedValuesSyncJobs)
      .innerJoin(dataSources, eq(dataSources.id, storedValuesSyncJobs.dataSourceId))
      .where(
        and(
          inArray(storedValuesSyncJobs.status, ['pending', 'pending_manual', 'pending_initial']),
          isNull(dataSources.deletedAt)
        )
      );

    return Number(result[0]?.count || 0);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Database error in countPendingSyncJobs: ${error.message}`);
    }

    throw new Error(`Unknown error in countPendingSyncJobs: ${String(error)}`);
  }
}
