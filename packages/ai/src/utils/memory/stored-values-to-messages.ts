import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type { CoreMessage } from 'ai';

/**
 * Creates a user message containing stored values search results
 * This is used to inject stored values into the message history for agent context
 *
 * @param searchResults - The formatted search results message
 * @returns CoreMessage with user role containing the stored values
 */
export function createStoredValuesToolCallMessage(searchResults: string): CoreMessage {
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text: searchResults,
      },
    ],
  };
}

/**
 * Creates a reasoning message for stored values to display in the reasoning UI
 * This treats the search results as a single file for transparency
 *
 * @param searchResults - The formatted search results message
 * @returns ChatMessageReasoningMessage with search results as a single file
 */
export function createStoredValuesReasoningMessage(
  searchResults: string
): Extract<ChatMessageReasoningMessage, { type: 'files' }> {
  const fileId = `stored-values-${Date.now()}-${Math.random().toString(36).substring(2)}`;

  return {
    id: fileId,
    type: 'files',
    title: 'Database Values Search',
    status: 'completed',
    secondary_title: undefined,
    file_ids: [fileId],
    files: {
      [fileId]: {
        id: fileId,
        file_type: 'agent-action',
        file_name: 'stored-values-search',
        version_number: 1,
        status: 'completed',
        file: {
          text: searchResults,
          modified: undefined,
        },
      },
    },
  };
}
