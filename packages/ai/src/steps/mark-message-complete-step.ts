import { updateMessage } from '@buster/database';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';

const inputSchema = z.object({
  messageId: z.string().describe('The message ID to mark as complete'),
  success: z.boolean().optional().describe('Whether the message was processed successfully'),
  metadata: z.record(z.any()).optional().describe('Additional metadata to store'),
});

const outputSchema = z.object({
  messageId: z.string().describe('The message ID that was marked complete'),
  completedAt: z.string().describe('ISO timestamp when the message was marked complete'),
  success: z.boolean().describe('Whether the operation was successful'),
});

const markMessageCompleteExecution = async ({
  runtimeContext,
}: {
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  try {
    const messageId = runtimeContext.get('messageId');
    if (!messageId) {
      throw new Error('No messageId found in runtime context');
    }

    await updateMessage(messageId, {
      isCompleted: true,
    });

    return {
      messageId,
      completedAt: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
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
