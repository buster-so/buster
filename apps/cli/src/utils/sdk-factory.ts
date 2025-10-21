import { type BusterSDK, createBusterSDK } from '@buster/sdk';
import { getCredentials } from './credentials';

/**
 * Cached SDK instance for singleton pattern
 */
let cachedSdk: BusterSDK | null = null;

/**
 * Creates an authenticated BusterSDK instance using saved credentials
 *
 * @returns BusterSDK instance configured with user credentials
 * @throws Error if credentials are missing or invalid
 */
export async function createAuthenticatedSdk(): Promise<BusterSDK> {
  // Get credentials from environment or saved file
  const credentials = await getCredentials();

  // Check if credentials exist
  if (!credentials) {
    throw new Error('No credentials found. Please login first using: buster login');
  }

  // Validate credentials
  if (!credentials.apiKey || !credentials.apiUrl) {
    throw new Error('Invalid credentials. Please login again using: buster login');
  }

  // Create and return SDK instance
  return createBusterSDK({
    apiKey: credentials.apiKey,
    apiUrl: credentials.apiUrl,
  });
}

/**
 * Gets or creates a cached BusterSDK instance
 *
 * Uses singleton pattern to avoid creating multiple SDK instances.
 * The SDK is cached after first creation and reused on subsequent calls.
 *
 * @returns Cached or newly created BusterSDK instance
 * @throws Error if credentials are missing or invalid
 */
export async function getOrCreateSdk(): Promise<BusterSDK> {
  // Return cached instance if available
  if (cachedSdk) {
    return cachedSdk;
  }

  // Create new instance and cache it
  cachedSdk = await createAuthenticatedSdk();
  return cachedSdk;
}

/**
 * Clears the cached SDK instance
 *
 * Useful for testing or when credentials change.
 * Next call to getOrCreateSdk() will create a new instance.
 */
export function clearCachedSdk(): void {
  cachedSdk = null;
}
