import { z } from 'zod';

/**
 * Schema for schema discrepancy details
 */
export const SchemaDiscrepancySchema = z.object({
  type: z.enum(['missing_table', 'missing_column', 'type_mismatch', 'unknown_column']),
  severity: z.enum(['critical', 'warning', 'info']),
  datasetId: z.string().uuid(),
  datasetName: z.string(),
  tableName: z.string(),
  columnName: z.string().optional(),
  message: z.string(),
  details: z
    .object({
      expectedType: z.string().optional(),
      actualType: z.string().optional(),
      ymlSource: z.enum(['dimension', 'measure']).optional(),
    })
    .optional(),
});

export type SchemaDiscrepancy = z.infer<typeof SchemaDiscrepancySchema>;

/**
 * Schema for schema sync run record
 */
export const SchemaSyncRunSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  status: z.enum(['running', 'completed', 'failed']),
  dataSourcesChecked: z.number().int().min(0),
  datasetsChecked: z.number().int().min(0),
  discrepanciesFound: z.number().int().min(0),
  criticalCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  error: z.string().optional(),
});

export type SchemaSyncRun = z.infer<typeof SchemaSyncRunSchema>;

/**
 * Extended schema sync run with discrepancies
 */
export interface SchemaSyncRunWithDiscrepancies
  extends Omit<SchemaSyncRun, 'startedAt' | 'completedAt'> {
  startedAt: Date;
  completedAt?: Date;
  discrepancies: SchemaDiscrepancy[];
  dataSources: string[];
  durationMs?: number;
}

/**
 * Slack block message format
 */
export interface SlackNotificationMessage {
  organizationId: string;
  runId: string;
  blocks: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    elements?: Array<{
      type: string;
      text?: string;
    }>;
    [key: string]: unknown; // Allow additional Slack block properties
  }>; // Slack block kit format
  text: string; // Fallback text
  messageType: string;
}
