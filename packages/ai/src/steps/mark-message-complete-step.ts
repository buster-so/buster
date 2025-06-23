import { updateMessage } from '@buster/database';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import {
  MessageHistorySchema,
  ReasoningHistorySchema,
  ResponseHistorySchema,
  StepFinishDataSchema,
} from '../utils/memory/types';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';

// Helper function to format duration
const formatDuration = (durationMs: number): string => {
  const seconds = Math.round(durationMs / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
};

// Analyst-specific metadata schema
const AnalystMetadataSchema = z.object({
  toolsUsed: z.array(z.string()).optional(),
  finalTool: z.string().optional(),
  doneTool: z.boolean().optional(),
  filesCreated: z.number().optional(),
  filesReturned: z.number().optional(),
});

// Input schema matches analyst step output
const inputSchema = z.object({
  conversationHistory: MessageHistorySchema,
  finished: z.boolean().optional(),
  outputMessages: MessageHistorySchema.optional(),
  stepData: StepFinishDataSchema.optional(),
  reasoningHistory: ReasoningHistorySchema,
  responseHistory: ResponseHistorySchema,
  metadata: AnalystMetadataSchema.optional(),
});

// Output schema passes through analyst data plus completion info
const outputSchema = z.object({
  conversationHistory: MessageHistorySchema,
  finished: z.boolean().optional(),
  outputMessages: MessageHistorySchema.optional(),
  stepData: StepFinishDataSchema.optional(),
  reasoningHistory: ReasoningHistorySchema,
  responseHistory: ResponseHistorySchema,
  metadata: AnalystMetadataSchema.optional(),
  // Completion metadata
  messageId: z.string().describe('The message ID that was marked complete'),
  completedAt: z.string().describe('ISO timestamp when the message was marked complete'),
  success: z.boolean().describe('Whether the operation was successful'),
});

const markMessageCompleteExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  try {
    const messageId = runtimeContext.get('messageId');
    const workflowStartTime = runtimeContext.get('workflowStartTime');
    const completedAt = new Date().toISOString();

    // Calculate workflow duration
    let finalReasoningMessage = 'complete';
    if (workflowStartTime) {
      const durationMs = Date.now() - workflowStartTime;
      const formattedDuration = formatDuration(durationMs);
      finalReasoningMessage = `Reasoned for ${formattedDuration}`;
    }

    // If no messageId, this is expected when running without database operations
    if (!messageId) {
      return {
        ...inputData, // Pass through all analyst data
        messageId: '', // Empty string to indicate no database operation
        completedAt,
        success: true,
      };
    }

    // Update the message in the database
    await updateMessage(messageId, {
      isCompleted: true,
      finalReasoningMessage,
    });

    return {
      ...inputData, // Pass through all analyst data
      messageId,
      completedAt,
      success: true,
    };
  } catch (error) {
    // Handle AbortError gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // Pass through the input data when aborted
      return {
        ...inputData,
        messageId: runtimeContext.get('messageId') || '',
        completedAt: new Date().toISOString(),
        success: false, // Mark as unsuccessful when aborted
      };
    }

    console.error('Error marking message as complete:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the database. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error(
      'Unable to mark message as complete. Please try again or contact support if the issue persists.'
    );
  }
};

export const markMessageCompleteStep = createStep({
  id: 'mark-message-complete',
  description: 'This step marks a message as complete with optional metadata and success status.',
  inputSchema,
  outputSchema,
  execute: markMessageCompleteExecution,
});
