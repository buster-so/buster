import { updateChat, updateMessage } from '@buster/database/queries';
import { z } from 'zod';
import { AssetTypeSchema } from '../../../../../database/src/schema-types/asset';

// Input schema with all necessary parameters
export const MarkMessageCompleteInputSchema = z.object({
  messageId: z.string().optional().describe('The message ID to mark as complete'),
  chatId: z.string().optional().describe('The chat ID to update with file information'),
  finalReasoningMessage: z
    .string()
    .optional()
    .describe('Final reasoning message for the completion'),
  selectedFile: z
    .object({
      fileId: z.string().uuid().optional(),
      fileType: AssetTypeSchema.optional(),
      versionNumber: z.number().optional(),
    })
    .optional()
    .describe('File information to update in the chat'),
});

// Output schema with completion info
export const MarkMessageCompleteOutputSchema = z.object({
  messageId: z.string().describe('The message ID that was marked complete'),
  completedAt: z.string().describe('ISO timestamp when the message was marked complete'),
  success: z.boolean().describe('Whether the operation was successful'),
});

export type MarkMessageCompleteInput = z.infer<typeof MarkMessageCompleteInputSchema>;
export type MarkMessageCompleteOutput = z.infer<typeof MarkMessageCompleteOutputSchema>;

export async function markMessageComplete(
  input: MarkMessageCompleteInput
): Promise<MarkMessageCompleteOutput> {
  try {
    const completedAt = new Date().toISOString();
    const finalReasoningMessage = input.finalReasoningMessage || 'complete';

    // If no messageId, this is expected when running without database operations
    if (!input.messageId) {
      return {
        messageId: '', // Empty string to indicate no database operation
        completedAt,
        success: true,
      };
    }

    // Update the message in the database
    await updateMessage(input.messageId, {
      isCompleted: true,
      finalReasoningMessage,
    });

    // Update chat with most recent file information if available
    if (input.selectedFile?.fileId && input.chatId) {
      await updateChat(input.chatId, {
        mostRecentFileId: input.selectedFile.fileId,
        mostRecentFileType: input.selectedFile.fileType,
        mostRecentVersionNumber: input.selectedFile.versionNumber,
      });
    }

    return {
      messageId: input.messageId,
      completedAt,
      success: true,
    };
  } catch (error) {
    // Handle AbortError gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        messageId: input.messageId || '',
        completedAt: new Date().toISOString(),
        success: false,
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
}
