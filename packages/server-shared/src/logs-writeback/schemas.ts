import { z } from 'zod';

// Schema for a single assumption in the log
export const LogAssumptionSchema = z.object({
  label: z.enum(['major', 'minor', 'timeRelated']).describe('Assumption severity level'),
  classification: z
    .enum([
      'fieldMapping',
      'segmentDefinition',
      'timePeriodInterpretation',
      'aggregation',
      'grouping',
      'metricInterpretation',
      'businessLogic',
      'dataRelevance',
    ])
    .describe('Type of assumption made'),
  descriptiveTitle: z.string().describe('Short title describing the assumption'),
  explanation: z.string().describe('Detailed explanation of the assumption'),
});

// Schema for the log record that will be written to Snowflake
export const LogsWritebackRecordSchema = z.object({
  messageId: z.string().describe('Unique identifier for the message'),
  userEmail: z.string().email().describe('Email of the user who initiated the query'),
  userName: z.string().describe('Name of the user who initiated the query'),
  chatId: z.string().describe('Chat session identifier'),
  chatLink: z.string().describe('Link to the chat in the Buster platform'),
  requestMessage: z.string().describe('The original user request message'),
  createdAt: z.date().describe('When the message was created'),
  durationSeconds: z.number().describe('Query execution duration in seconds'),
  confidenceScore: z.enum(['high', 'low']).describe('Confidence level of the response'),
  assumptions: z.array(LogAssumptionSchema).describe('List of assumptions made during query'),
});

// Schema for the trigger task input
export const LogsWritebackTaskInputSchema = z.object({
  messageId: z.string().describe('Message ID to process for writeback'),
  organizationId: z.string().describe('Organization ID for configuration lookup'),
});

// Schema for the trigger task output
export const LogsWritebackTaskOutputSchema = z.object({
  success: z.boolean().describe('Whether the writeback was successful'),
  messageId: z.string().describe('Message ID that was processed'),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    })
    .optional()
    .describe('Error details if writeback failed'),
});

// Type exports
export type LogAssumption = z.infer<typeof LogAssumptionSchema>;
export type LogsWritebackRecord = z.infer<typeof LogsWritebackRecordSchema>;
export type LogsWritebackTaskInput = z.infer<typeof LogsWritebackTaskInputSchema>;
export type LogsWritebackTaskOutput = z.infer<typeof LogsWritebackTaskOutputSchema>;
