import { StatusSchema } from '@buster/server-shared/chats';
import { tool } from 'ai';
import { z } from 'zod';
import { AnalysisModeSchema } from '../../../../types/analysis-mode.types';
import { createCreateReportsDelta } from './create-reports-delta';
import { createCreateReportsExecute } from './create-reports-execute';
import { createCreateReportsFinish } from './create-reports-finish';
import { createReportsStart } from './create-reports-start';
import CREATE_REPORTS_TOOL_INVESTIGATION_DESCRIPTION from './create-reports-tool-investigation-description.txt';
import CREATE_REPORTS_TOOL_STANDARD_DESCRIPTION from './create-reports-tool-standard-description.txt';

export const CREATE_REPORTS_TOOL_NAME = 'createReports';

// Input schema for the create reports tool - now accepts a single report
const CreateReportsInputSchema = z.object({
  name: z
    .string()
    .describe(
      'The descriptive name/title for the report. This should be a clear, professional title that indicates the report subject and scope. Examples: "Q4 Sales Analysis", "Customer Retention Study", "Marketing Campaign Performance Review"'
    ),
  content: z
    .string()
    .describe(
      'The markdown content for the report. Should be well-structured with headers, sections, and clear analysis.'
    ),
});

// Output schema for the create reports tool - now returns a single report or error
const CreateReportsOutputSchema = z.object({
  message: z.string(),
  file: z
    .object({
      id: z.string(),
      name: z.string(),
      version_number: z.number(),
    })
    .optional(),
  error: z.string().optional(),
});

// Context schema for the create reports tool
const CreateReportsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
  analysisMode: AnalysisModeSchema.optional().describe('The analysis mode for report generation'),
});

const CreateReportStateFileSchema = z.object({
  id: z.string().uuid(),
  file_name: z.string().optional(),
  file_type: z.string(),
  version_number: z.number(),
  file: z
    .object({
      text: z.string(),
    })
    .optional(),
  status: StatusSchema,
  error: z.string().optional(),
});

const CreateReportsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  file: CreateReportStateFileSchema.optional(), // Changed from array to single file
  startTime: z.number().optional(),
  initialEntriesCreated: z.boolean().optional(),
  responseMessageCreated: z.boolean().optional(), // Changed from set to boolean
  reportModifiedInMessage: z.boolean().optional(), // Changed from set to boolean
});

// Export types
export type CreateReportsInput = z.infer<typeof CreateReportsInputSchema>;
export type CreateReportsOutput = z.infer<typeof CreateReportsOutputSchema>;
export type CreateReportsContext = z.infer<typeof CreateReportsContextSchema>;
export type CreateReportsState = z.infer<typeof CreateReportsStateSchema>;
export type CreateReportStateFile = z.infer<typeof CreateReportStateFileSchema>;

// Factory function that accepts agent context and maps to tool context
export function createCreateReportsTool(context: CreateReportsContext) {
  // Initialize state for streaming
  const state: CreateReportsState = {
    argsText: undefined,
    file: undefined,
    toolCallId: undefined,
    reportModifiedInMessage: false,
  };

  // Select the appropriate description based on analysis mode
  const description =
    context.analysisMode === 'investigation'
      ? CREATE_REPORTS_TOOL_INVESTIGATION_DESCRIPTION
      : CREATE_REPORTS_TOOL_STANDARD_DESCRIPTION;

  // Create all functions with the context and state passed
  const execute = createCreateReportsExecute(context, state);
  const onInputStart = createReportsStart(context, state);
  const onInputDelta = createCreateReportsDelta(context, state);
  const onInputAvailable = createCreateReportsFinish(context, state);

  return tool({
    description,
    inputSchema: CreateReportsInputSchema,
    outputSchema: CreateReportsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
