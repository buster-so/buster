import { StatusSchema } from '@buster/server-shared/chats';
import { tool } from 'ai';
import { z } from 'zod';
import { createModifyReportsDelta } from './modify-reports-delta';
import { createModifyReportsExecute } from './modify-reports-execute';
import { createModifyReportsFinish } from './modify-reports-finish';
import { modifyReportsStart } from './modify-reports-start';
import MODIFY_REPORT_TOOL_DESCRIPTION from './modify-reports-tool-description.txt';

export const MODIFY_REPORTS_TOOL_NAME = 'modifyReports';

const ModifyReportsEditSchema = z.object({
  operation: z.enum(['replace', 'append']).describe(
    `You should perform an append when you just want to add new content to the end of the report. 
      You should perform a replace when you want to replace existing content with new content.
      Appending is preferred over replacing because it is more efficient and less likely to cause issues.
      If you are replacing content, you should provide the content you want to replace and the new content you want to insert.`
  ),
  code_to_replace: z
    .string()
    .describe(
      'The string content that should be replaced in the current report content. This is required for the replace operation. Will just be an empty string for the append operation.'
    ),
  code: z
    .string()
    .describe(
      'The new markdown content to insert. Either replaces code_to_replace or appends to the end. This is required for both the replace and append operations.'
    ),
});

// Input schema for the modify reports tool
const ModifyReportsInputSchema = z.object({
  id: z.string().uuid().describe('The UUID of the report to edit. Must be an existing report ID.'),
  name: z.string().describe('The name of the report (for reference and tracking purposes)'),
  edits: z
    .array(ModifyReportsEditSchema)
    .min(1)
    .describe('Array of edit operations to apply sequentially to the report'),
});

// Output schema for the modify reports tool
const ModifyReportsOutputSchema = z.object({
  success: z.boolean().describe('Whether all edits were successfully applied'),
  message: z.string().describe('Human-readable result message'),
  file: z.object({
    id: z.string().describe('The report ID'),
    name: z.string().describe('The report name'),
    content: z.string().describe('The updated report content after all edits'),
    version_number: z.number().describe('The new version number after edits'),
    updated_at: z.string().describe('ISO timestamp of the update'),
  }),
  error: z.string().optional().describe('Error details if any operations failed'),
});

// Context schema for the modify reports tool
const ModifyReportsContextSchema = z.object({
  userId: z.string().describe('The user ID'),
  chatId: z.string().describe('The chat ID'),
  organizationId: z.string().describe('The organization ID'),
  messageId: z.string().optional().describe('The message ID'),
});

const ModifyReportsEditStateSchema = z.object({
  operation: z.enum(['replace', 'append']),
  code_to_replace: z.string(),
  code: z.string(),
  status: StatusSchema,
  error: z.string().optional(),
});

const ModifyReportsStateSchema = z.object({
  toolCallId: z.string().optional(),
  argsText: z.string().optional(),
  reportId: z.string().uuid().optional(),
  reportName: z.string().optional(),
  edits: z.array(ModifyReportsEditStateSchema).optional(),
  finalContent: z.string().optional(),
  version_number: z.number().optional(),
  startTime: z.number().optional(),
  responseMessageCreated: z.boolean().optional(),
  snapshotContent: z.string().optional(),
  lastSavedContent: z
    .string()
    .optional()
    .describe('Track the last content saved to DB to avoid redundant updates'),
  reportModifiedInMessage: z.boolean().optional(),
  snapshotVersion: z.number().optional(),
  versionHistory: z
    .record(
      z.object({
        content: z.string(),
        updated_at: z.string(),
        version_number: z.number(),
      })
    )
    .optional(),
  isComplete: z.boolean().optional().describe('Whether the tool execution is complete'),
  firstDelta: z.boolean().optional().describe('Whether this is the first delta'),
});

// Export types
export type ModifyReportsInput = z.infer<typeof ModifyReportsInputSchema>;
export type ModifyReportsOutput = z.infer<typeof ModifyReportsOutputSchema>;
export type ModifyReportsContext = z.infer<typeof ModifyReportsContextSchema>;
export type ModifyReportsEditState = z.infer<typeof ModifyReportsEditStateSchema>;

// Extend the inferred type to include Promise fields (not supported by Zod directly)
export type ModifyReportsState = z.infer<typeof ModifyReportsStateSchema> & {
  lastUpdate?: Promise<void>; // Track the last write promise for sequential chaining (deprecated, use lastProcessing)
  lastProcessing?: Promise<void>; // Track the entire processing chain for proper sequencing
};

// Factory function that accepts agent context and maps to tool context
export function createModifyReportsTool(context: ModifyReportsContext) {
  // Initialize state for streaming
  const state: ModifyReportsState = {
    argsText: undefined,
    reportId: undefined,
    reportName: undefined,
    edits: [],
    finalContent: undefined,
    version_number: undefined,
    toolCallId: undefined,
    responseMessageCreated: false,
    snapshotContent: undefined,
    reportModifiedInMessage: false,
    firstDelta: true,
  };

  // Create all functions with the context and state passed
  const execute = createModifyReportsExecute(context, state);
  const onInputStart = modifyReportsStart(context, state);
  const onInputDelta = createModifyReportsDelta(context, state);
  const onInputAvailable = createModifyReportsFinish(context, state);

  return tool({
    description: MODIFY_REPORT_TOOL_DESCRIPTION,
    inputSchema: ModifyReportsInputSchema,
    outputSchema: ModifyReportsOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
