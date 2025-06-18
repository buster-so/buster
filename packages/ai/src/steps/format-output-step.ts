import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { z } from 'zod';
import {
  type MessageHistory,
  MessageHistorySchema,
  ReasoningHistorySchema,
  ResponseHistorySchema,
  StepFinishDataSchema,
} from '../utils/memory/types';
import { executeWorkflowCleanup } from '../utils/workflow-cleanup';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';

// The mark-message-complete step output schema (includes completion fields)
const MarkMessageCompleteOutputSchema = z.object({
  conversationHistory: MessageHistorySchema,
  finished: z.boolean().optional(),
  outputMessages: MessageHistorySchema.optional(),
  stepData: StepFinishDataSchema.optional(),
  reasoningHistory: ReasoningHistorySchema, // Add reasoning history
  responseHistory: ResponseHistorySchema, // Add response history
  metadata: z
    .object({
      toolsUsed: z.array(z.string()).optional(),
      finalTool: z.string().optional(),
      doneTool: z.boolean().optional(),
      filesCreated: z.number().optional(),
      filesReturned: z.number().optional(),
    })
    .optional(),
  // Completion metadata from mark-message-complete step
  messageId: z.string(),
  completedAt: z.string(),
  success: z.boolean(),
});

// Input now comes from mark-message-complete step
const inputSchema = MarkMessageCompleteOutputSchema;

// Metadata schema for workflow output
const WorkflowMetadataSchema = z.object({
  toolsUsed: z.array(z.string()).optional(),
  finalTool: z.string().optional(),
  text: z.string().optional(),
  reasoning: z.string().optional(),
  doneTool: z.boolean().optional(),
  filesCreated: z.number().optional(),
  filesReturned: z.number().optional(),
});

// Clean output schema matching the workflow output schema
const outputSchema = z.object({
  title: z.string().optional(),
  todos: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  conversationHistory: MessageHistorySchema.optional(),
  finished: z.boolean().optional(),
  outputMessages: MessageHistorySchema.optional(),
  stepData: StepFinishDataSchema.optional(),
  reasoningHistory: ReasoningHistorySchema, // Add reasoning history
  responseHistory: ResponseHistorySchema, // Add response history
  metadata: WorkflowMetadataSchema.optional(),
});

const formatOutputExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  // Generate workflow ID for cleanup
  const dataSourceId = runtimeContext.get('dataSourceId');
  const workflowStartTime = runtimeContext.get('workflowStartTime');
  const workflowId = `workflow-${workflowStartTime}-${dataSourceId}`;

  try {
    // Helper function to safely extract CoreMessage array
    const getMessageArray = (messages: MessageHistory | undefined): CoreMessage[] => {
      if (!messages || !Array.isArray(messages)) {
        return [];
      }
      return messages;
    };

    // Simply map the analyst output to the workflow output format
    const output = {
      // Core conversation data
      conversationHistory: getMessageArray(inputData.conversationHistory),
      finished: inputData.finished ?? false,
      outputMessages: getMessageArray(inputData.outputMessages),
      stepData: inputData.stepData ?? undefined,
      reasoningHistory: inputData.reasoningHistory || [],
      responseHistory: inputData.responseHistory || [],
      metadata: inputData.metadata ?? undefined,

      // These fields would come from parallel steps in a more complex implementation
      // For now, they're always undefined as they're not passed through the analyst step
      title: undefined,
      todos: undefined,
      values: undefined,
    };

    // Cleanup workflow resources before returning
    try {
      await executeWorkflowCleanup(workflowId);
    } catch (cleanupError) {
      console.error(`[format-output] Failed to cleanup workflow ${workflowId}:`, cleanupError);
      // Don't fail the workflow due to cleanup errors
    }

    return output;
  } catch (error) {
    // Handle AbortError gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // Return the input data in the output format when aborted
      const getMessageArray = (messages: MessageHistory | undefined): CoreMessage[] => {
        if (!messages || !Array.isArray(messages)) {
          return [];
        }
        return messages;
      };

      return {
        conversationHistory: getMessageArray(inputData.conversationHistory),
        finished: inputData.finished ?? false,
        outputMessages: getMessageArray(inputData.outputMessages),
        stepData: inputData.stepData ?? undefined,
        reasoningHistory: inputData.reasoningHistory || [],
        responseHistory: inputData.responseHistory || [],
        metadata: inputData.metadata ?? undefined,
        title: undefined,
        todos: undefined,
        values: undefined,
      };
    }

    // Cleanup workflow resources before throwing error
    try {
      await executeWorkflowCleanup(workflowId);
    } catch (cleanupError) {
      console.error(
        `[format-output] Failed to cleanup workflow ${workflowId} after error:`,
        cleanupError
      );
    }

    // For all other errors, throw with context
    throw new Error(
      `Error in format output step: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const formatOutputStep = createStep({
  id: 'format-output',
  description: 'Formats the workflow output to match the defined output schema',
  inputSchema,
  outputSchema,
  execute: formatOutputExecution,
});
