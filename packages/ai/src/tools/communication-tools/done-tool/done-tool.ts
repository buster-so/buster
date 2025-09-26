import { AssetTypeSchema } from '@buster/server-shared';
import { tool } from 'ai';
import { z } from 'zod';
import { createDoneToolDelta } from './done-tool-delta';
import { createDoneToolExecute } from './done-tool-execute';
import { createDoneToolFinish } from './done-tool-finish';
import { createDoneToolStart } from './done-tool-start';

export const DONE_TOOL_NAME = 'doneTool';

export const DoneToolInputSchema = z.object({
  assetsToReturn: z
    .array(
      z.object({
        assetId: z.string().uuid(),
        assetName: z.string(),
        assetType: AssetTypeSchema,
      })
    )
    .describe(
      'This should always be the first argument returned by the done tool.  This should be the top-level asset that the user is trying to work with.  Metrics, when involved in dashboards and reports, should always be bundled into their respective top-level assets.  If a user asks to modify a metric on a dashboard or report then the dashboard or report should be returned here. A good rule of thumb is if any dashboard or report exists in the chat and a metric is part of it, the metric should not be returned.'
    ),
  finalResponse: z
    .string()
    .min(1, 'Final response is required')
    .describe(
      "The final response message to the user. **MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. Do not include markdown tables."
    ),
});

const DoneToolOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
});

const DoneToolContextSchema = z.object({
  messageId: z.string().describe('The message ID of the message that triggered the done tool'),
  chatId: z.string().describe('The chat ID that this message belongs to'),
  workflowStartTime: z.number().describe('The start time of the workflow'),
});

const DoneToolStateSchema = z.object({
  toolCallId: z
    .string()
    .optional()
    .describe(
      'The entry ID of the entry that triggered the done tool. This is optional and will be set by the tool start'
    ),
  args: z.string().optional().describe('The arguments of the done tool'),
  finalResponse: z
    .string()
    .optional()
    .describe(
      'The final response message to the user. This is optional and will be set by the tool delta and finish'
    ),
  addedAssetIds: z
    .array(z.string())
    .optional()
    .describe('Asset IDs that have already been inserted as response messages to avoid duplicates'),
  addedAssets: z
    .array(
      z.object({
        assetId: z.string(),
        assetType: z.enum([
          'metric_file',
          'dashboard_file',
          'report_file',
          'analyst_chat',
          'collection',
        ]),
      })
    )
    .optional()
    .describe('Assets that have been added with their types for chat update'),
});

export type DoneToolInput = z.infer<typeof DoneToolInputSchema>;
export type DoneToolOutput = z.infer<typeof DoneToolOutputSchema>;
export type DoneToolContext = z.infer<typeof DoneToolContextSchema>;
export type DoneToolState = z.infer<typeof DoneToolStateSchema>;

export function createDoneTool(context: DoneToolContext) {
  const state: DoneToolState = {
    toolCallId: undefined,
    args: undefined,
    finalResponse: undefined,
    addedAssetIds: [],
    addedAssets: [],
  };

  const execute = createDoneToolExecute(context, state);
  const onInputStart = createDoneToolStart(context, state);
  const onInputDelta = createDoneToolDelta(context, state);
  const onInputAvailable = createDoneToolFinish(context, state);

  return tool({
    description:
      "Marks all remaining unfinished tasks as complete, sends a final response to the user, and ends the workflow. Use this when the workflow is finished. This must be in markdown format and not use the '•' bullet character.",
    inputSchema: DoneToolInputSchema,
    outputSchema: DoneToolOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}

// Default instance requires a context to be passed
// export const doneTool = createDoneTool();
