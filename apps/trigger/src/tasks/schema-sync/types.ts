import { z } from 'zod';

// Schema sync task input - triggered by cron schedule
export const TaskInputSchema = z.object({
  // Cron jobs receive a timestamp payload
  timestamp: z.string().datetime().optional(),
});

// Task execution result for internal monitoring
export const TaskExecutionResultSchema = z.object({
  success: z.boolean(),
  executionTimeMs: z.number(),
  organizationsProcessed: z.number(),
  totalDiscrepancies: z.number(),
  criticalIssues: z.number(),
  warnings: z.number(),
  notificationsSent: z.number(),
  errors: z
    .array(
      z.object({
        organizationId: z.string(),
        organizationName: z.string(),
        error: z.string(),
      })
    )
    .optional(),
});

// Main output schema - what Trigger.dev expects
export const TaskOutputSchema = z.object({
  success: z.boolean(),
  timestamp: z.string().datetime(),
  result: TaskExecutionResultSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
    })
    .optional(),
});

// Schema for organization processing result
export const OrganizationSyncResultSchema = z.object({
  organizationId: z.string().uuid(),
  organizationName: z.string(),
  success: z.boolean(),
  dataSourcesChecked: z.number(),
  datasetsChecked: z.number(),
  discrepancies: z.number(),
  criticalCount: z.number(),
  warningCount: z.number(),
  notificationSent: z.boolean(),
  error: z.string().optional(),
});

// Infer TypeScript types from schemas
export type TaskInput = z.infer<typeof TaskInputSchema>;
export type TaskOutput = z.infer<typeof TaskOutputSchema>;
export type TaskExecutionResult = z.infer<typeof TaskExecutionResultSchema>;
export type OrganizationSyncResult = z.infer<typeof OrganizationSyncResultSchema>;

// Error types
export class SchemaSyncError extends Error {
  constructor(
    message: string,
    public organizationId?: string
  ) {
    super(message);
    this.name = 'SchemaSyncError';
  }
}

export class DataSourceConnectionError extends Error {
  constructor(
    message: string,
    public dataSourceId: string
  ) {
    super(message);
    this.name = 'DataSourceConnectionError';
  }
}
