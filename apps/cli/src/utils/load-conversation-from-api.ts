import type { ModelMessage } from '@buster/ai';
import { createBusterSDK } from '@buster/sdk';
import type { Conversation } from './conversation-history';
import { loadConversation as loadConversationFromDisk } from './conversation-history';
import { getCredentials } from './credentials';

/**
 * Loads a conversation from the API first, falling back to local disk
 * This is the primary way to load conversations when resuming a chat
 *
 * Strategy:
 * 1. Try loading from API if credentials are available
 * 2. Fall back to local disk if API fails or credentials unavailable
 * 3. Return null if neither source has the conversation
 */
export async function loadConversation(
  chatId: string,
  workingDirectory: string
): Promise<Conversation | null> {
  // Try loading from API first if credentials are available
  try {
    const credentials = await getCredentials();
    if (credentials) {
      const sdk = createBusterSDK({
        apiKey: credentials.apiKey,
        apiUrl: credentials.apiUrl,
      });

      const response = await sdk.messages.getRawMessages(chatId);
      if (response.success && response.rawLlmMessages) {
        // Return conversation loaded from API
        return {
          chatId,
          workingDirectory,
          createdAt: new Date().toISOString(), // We don't have this from API
          updatedAt: new Date().toISOString(),
          modelMessages: response.rawLlmMessages as ModelMessage[],
        };
      }
    }
  } catch (error) {
    // Log error and fall through to disk load
    console.warn('Failed to load conversation from API, falling back to disk:', error);
  }

  // Fall back to loading from disk
  return loadConversationFromDisk(chatId, workingDirectory);
}
