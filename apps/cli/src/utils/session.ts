import { randomUUID } from 'node:crypto';

/**
 * Session state - holds the current chat ID for the CLI session
 * Simplified for API-first approach - no file system dependencies
 */
let currentChatId: string | null = null;

/**
 * Initializes a new session with a fresh chat ID
 * Always generates a new UUID - no file system lookups
 */
export function initNewSession(): string {
  currentChatId = randomUUID();
  return currentChatId;
}

/**
 * Gets the current chat ID for this session
 * Throws an error if session hasn't been initialized
 */
export function getCurrentChatId(): string {
  if (!currentChatId) {
    throw new Error('Session not initialized. Call initNewSession() first.');
  }
  return currentChatId;
}

/**
 * Sets the current chat ID to a specific value
 * Used when resuming a specific conversation from history browser
 */
export function setSessionChatId(chatId: string): void {
  currentChatId = chatId;
}
