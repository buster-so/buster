import { updateChat, updateMessage, updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { UpdateMessageEntriesParams } from '../../../../../database/src/queries/messages/update-message-entries';
import type { DoneToolContext, DoneToolState } from './done-tool';
import {
  createFileResponseMessages,
  extractAllFilesForChatUpdate,
  extractFilesFromToolCalls,
} from './helpers/done-tool-file-selection';
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

// Factory function that creates a type-safe callback for the specific agent context
export function createDoneToolStart(context: DoneToolContext, doneToolState: DoneToolState) {
  return async function doneToolStart(options: ToolCallOptions): Promise<void> {
    // Reset state for new tool call to prevent contamination from previous calls
    doneToolState.toolCallId = options.toolCallId;
    doneToolState.args = undefined;
    doneToolState.finalResponse = undefined;

    // Extract files from the tool call responses in messages
    if (options.messages) {
      console.info('[done-tool-start] Extracting files from messages', {
        messageCount: options.messages?.length,
        toolCallId: options.toolCallId,
      });

      // Extract files for response messages (filtered to avoid duplicates)
      const extractedFiles = extractFilesFromToolCalls(options.messages);

      // Extract ALL files for updating the chat's most recent file (includes reports)
      const allFilesForChatUpdate = extractAllFilesForChatUpdate(options.messages);

      console.info('[done-tool-start] Files extracted', {
        extractedCount: extractedFiles.length,
        files: extractedFiles.map((f) => ({ id: f.id, type: f.fileType, name: f.fileName })),
        allFilesCount: allFilesForChatUpdate.length,
        allFiles: allFilesForChatUpdate.map((f) => ({
          id: f.id,
          type: f.fileType,
          name: f.fileName,
        })),
      });

      // Add extracted files as response messages (these are filtered to avoid duplicates)
      if (extractedFiles.length > 0 && context.messageId) {
        const fileResponses = createFileResponseMessages(extractedFiles);

        console.info('[done-tool-start] Creating file response messages', {
          responseCount: fileResponses.length,
        });

        // Add all files as response entries to the database in a single batch
        try {
          await updateMessageEntries({
            messageId: context.messageId,
            responseMessages: fileResponses,
          });
        } catch (error) {
          console.error('[done-tool] Failed to add file response entries:', error);
        }
      }

      // Update the chat with the most recent file (using ALL files, including reports)
      if (context.chatId && allFilesForChatUpdate.length > 0) {
        // Sort files by version number (descending) to get the most recent
        const sortedFiles = allFilesForChatUpdate.sort((a, b) => {
          const versionA = a.versionNumber || 1;
          const versionB = b.versionNumber || 1;
          return versionB - versionA;
        });

        // Prefer reports over other file types for the chat's most recent file
        const reportFile = sortedFiles.find((f) => f.fileType === 'report');
        const mostRecentFile = reportFile || sortedFiles[0];

        if (mostRecentFile) {
          console.info('[done-tool-start] Updating chat with most recent file', {
            chatId: context.chatId,
            fileId: mostRecentFile.id,
            fileType: mostRecentFile.fileType,
            fileName: mostRecentFile.fileName,
            versionNumber: mostRecentFile.versionNumber,
            isReport: mostRecentFile.fileType === 'report',
          });

          try {
            await updateChat(context.chatId, {
              mostRecentFileId: mostRecentFile.id,
              mostRecentFileType: mostRecentFile.fileType as 'metric' | 'dashboard' | 'report',
              mostRecentVersionNumber: mostRecentFile.versionNumber || 1,
            });
          } catch (error) {
            console.error('[done-tool] Failed to update chat with most recent file:', error);
          }
        }
      }
    }

    const doneToolResponseEntry = createDoneToolResponseMessage(doneToolState, options.toolCallId);
    const doneToolMessage = createDoneToolRawLlmMessageEntry(doneToolState, options.toolCallId);

    const entries: UpdateMessageEntriesParams = {
      messageId: context.messageId,
    };

    if (doneToolResponseEntry) {
      entries.responseMessages = [doneToolResponseEntry];
    }

    if (doneToolMessage) {
      entries.rawLlmMessages = [doneToolMessage];
    }

    try {
      if (entries.responseMessages || entries.rawLlmMessages) {
        await updateMessageEntries(entries);
      }

      // Mark message as completed and add final reasoning message with workflow time
      if (context.messageId) {
        const currentTime = Date.now();
        const elapsedTimeMs = currentTime - context.workflowStartTime;
        const elapsedSeconds = Math.floor(elapsedTimeMs / 1000);

        let timeString: string;
        if (elapsedSeconds < 60) {
          timeString = `${elapsedSeconds} seconds`;
        } else {
          const elapsedMinutes = Math.floor(elapsedSeconds / 60);
          timeString = `${elapsedMinutes} minutes`;
        }

        await updateMessage(context.messageId, {
          isCompleted: true,
          finalReasoningMessage: `Reasoned for ${timeString}`,
        });
      }
    } catch (error) {
      console.error('[done-tool] Failed to update done tool raw LLM message:', error);
    }
  };
}
