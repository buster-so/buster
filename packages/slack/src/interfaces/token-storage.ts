import { z } from 'zod';

/**
 * Interface for token storage implementations.
 * Consuming applications must implement this interface
 * to store and retrieve Slack access tokens securely.
 */
export interface ISlackTokenStorage {
  /**
   * Store a Slack access token
   * @param key Unique identifier for the token (e.g., userId, integrationId)
   * @param token The access token to store
   */
  storeToken(key: string, token: string): Promise<void>;

  /**
   * Retrieve a Slack access token
   * @param key Unique identifier for the token
   * @returns The access token or null if not found
   */
  getToken(key: string): Promise<string | null>;

  /**
   * Delete a Slack access token
   * @param key Unique identifier for the token
   */
  deleteToken(key: string): Promise<void>;

  /**
   * Check if a token exists
   * @param key Unique identifier for the token
   */
  hasToken(key: string): Promise<boolean>;
}

/**
 * Interface for OAuth state storage.
 * Used to store temporary OAuth state for CSRF protection.
 */
export interface ISlackOAuthStateStorage {
  /**
   * Store OAuth state
   * @param state The state string
   * @param data State data including expiry
   */
  storeState(state: string, data: SlackOAuthStateData): Promise<void>;

  /**
   * Retrieve and validate OAuth state
   * @param state The state string
   * @returns State data if valid and not expired, null otherwise
   */
  getState(state: string): Promise<SlackOAuthStateData | null>;

  /**
   * Delete OAuth state
   * @param state The state string
   */
  deleteState(state: string): Promise<void>;
}

export const SlackOAuthStateDataSchema = z.object({
  expiresAt: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type SlackOAuthStateData = z.infer<typeof SlackOAuthStateDataSchema>;
