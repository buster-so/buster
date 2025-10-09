import { randomUUID } from 'node:crypto';
import { getLatestConversation } from './conversation-history';

/**
 * Session state - holds the current chat ID for the CLI session
 */
let currentChatId: string | null = null;

/**
 * Initializes a new session with a fresh chat ID
 */
export function initNewSession(): string {
  currentChatId = randomUUID();
  return currentChatId;
}

/**
 * Attempts to resume the latest conversation for the given working directory
 * If no conversation exists, creates a new session
 */
export async function initOrResumeSession(workingDirectory: string): Promise<{
  chatId: string;
  isResumed: boolean;
  messageCount: number;
}> {
  const latestConversation = await getLatestConversation(workingDirectory);

  if (latestConversation) {
    currentChatId = latestConversation.chatId;
    return {
      chatId: currentChatId,
      isResumed: true,
      messageCount: latestConversation.modelMessages.length,
    };
  }

  // No previous conversation, start new one
  currentChatId = randomUUID();
  return {
    chatId: currentChatId,
    isResumed: false,
    messageCount: 0,
  };
}

/**
 * Gets the current chat ID for this session
 * Throws an error if session hasn't been initialized
 */
export function getCurrentChatId(): string {
  if (!currentChatId) {
    throw new Error(
      'Session not initialized. Call initNewSession() or initOrResumeSession() first.'
    );
  }
  return currentChatId;
}

/**
 * Starts a new conversation (generates new chat ID)
 * Used when user explicitly wants to start fresh
 */
export function startNewConversation(): string {
  return initNewSession();
}

/**
 * Checks if a session has been initialized
 */
export function hasActiveSession(): boolean {
  return currentChatId !== null;
}

/**
 * Sets the current chat ID to a specific value
 * Used when resuming a specific conversation from history
 */
export function setSessionChatId(chatId: string): void {
  currentChatId = chatId;
}
