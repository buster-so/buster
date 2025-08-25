import { StatusSchema } from '@buster/server-shared/chats';
import { tool } from 'ai';
import { z } from 'zod';
import { createCreateReportsDelta } from './create-reports-delta';
import { createCreateReportsExecute } from './create-reports-execute';
import { createCreateReportsFinish } from './create-reports-finish';
import { createReportsStart } from './create-reports-start';
import CREATE_REPORTS_TOOL_DESCRIPTION from './create-reports-tool-description.txt';

export const CREATE_REPORTS_TOOL_NAME = 'createReports';

const CreateReportsInputFileSchema = z.object({
  name: z
    .string()
    .describe(
      'The descriptive name/title for the report. This should be a clear, professional title that indicates the report subject and scope. Examples: "Q4 Sales Analysis", "Customer Retention Study", "Marketing Campaign Performance Review"'
    ),
  content: z
    .string()
    .describe(
      'The markdown content for the report. Should be well-structured with headers, sections, and clear analysis. Multiple reports can be created in one call by providing multiple entries in the files array. **Prefer creating reports in bulk.**'
    ),
});

// Input schema for the create reports tool
const CreateReportsInputSchema = z.object({
  files: z
    .array(CreateReportsInputFileSchema)
    .min(1)
    .describe(
      'List of report file parameters to create. Each report should contain comprehensive markdown content with analysis, findings, and recommendations.'
    ),
});

const CreateReportsOutputFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  version_number: z.number(),
});

const CreateReportsOutputFailedFileSchema = z.object({
  name: z.string(),
  error: z.string(),
});

// Output schema for the create reports tool
const CreateReportsOutputSchema = z.object({
  message: z.string(),
  files: z.array(CreateReportsOutputFileSchema),
  failed_files: z.array(CreateReportsOutputFailedFileSchema),
});

// Context schema for the create reports tool
const CreateReportsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
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
  files: z.array(CreateReportStateFileSchema).optional(),
  startTime: z.number().optional(),
  initialEntriesCreated: z.boolean().optional(),
  responseMessagesCreated: z.set(z.string()).optional(),
  reportsModifiedInMessage: z.set(z.string()).optional(),
});

// Export types
export type CreateReportsInput = z.infer<typeof CreateReportsInputSchema>;
export type CreateReportsOutput = z.infer<typeof CreateReportsOutputSchema>;
export type CreateReportsContext = z.infer<typeof CreateReportsContextSchema>;
export type CreateReportsOutputFile = z.infer<typeof CreateReportsOutputFileSchema>;
export type CreateReportsOutputFailedFile = z.infer<typeof CreateReportsOutputFailedFileSchema>;
export type CreateReportsState = z.infer<typeof CreateReportsStateSchema>;
export type CreateReportStateFile = z.infer<typeof CreateReportStateFileSchema>;

// Factory function that accepts agent context and maps to tool context
export function createCreateReportsTool(context: CreateReportsContext) {
  // Initialize state for streaming
  const state: CreateReportsState = {
    argsText: undefined,
    files: [],
    toolCallId: undefined,
    reportsModifiedInMessage: new Set(),
  };

  // Create all functions with the context and state passed
  const execute = createCreateReportsExecute(context, state);
  const onInputStart = createReportsStart(context, state);
  const onInputDelta = createCreateReportsDelta(context, state);
  const onInputAvailable = createCreateReportsFinish(context, state);

  return tool({
    description: CREATE_REPORTS_TOOL_DESCRIPTION,
    inputSchema: CreateReportsInputSchema,
    outputSchema: CreateReportsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
