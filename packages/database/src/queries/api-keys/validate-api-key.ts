import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '../../connection';
import { apiKeys, organizations, users } from '../../schema';

export interface ApiKeyValidation {
  id: string;
  ownerId: string;
  organizationId: string;
  key: string;
}

/**
 * Validates an API key and returns the associated data if valid
 * @param key The API key to validate
 * @returns The API key data if valid, null otherwise
 */
export async function validateApiKey(key: string): Promise<ApiKeyValidation | null> {
  const db = getDb();

  try {
    const result = await db
      .select({
        id: apiKeys.id,
        ownerId: apiKeys.ownerId,
        organizationId: apiKeys.organizationId,
        key: apiKeys.key,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.key, key), isNull(apiKeys.deletedAt)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Simple boolean validation check for API keys
 * @param apiKey - The API key string to validate
 * @returns Promise<boolean> - true if the API key is valid, false otherwise
 */
export async function isApiKeyValid(apiKey: string): Promise<boolean> {
  const result = await validateApiKey(apiKey);
  return result !== null;
}

/**
 * Gets the API key details if it exists and is not soft-deleted
 * This is a compatibility wrapper around validateApiKey
 * @param apiKey - The API key string to validate
 * @returns Promise<{id: string; organizationId: string; ownerId: string} | null>
 */
export async function getApiKeyDetails(apiKey: string): Promise<{
  id: string;
  organizationId: string;
  ownerId: string;
} | null> {
  const result = await validateApiKey(apiKey);

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    organizationId: result.organizationId,
    ownerId: result.ownerId,
  };
}

/**
 * Gets the organization associated with an API key
 * @param apiKeyId The API key ID
 * @returns The organization data if found, null otherwise
 */
export async function getApiKeyOrganization(apiKeyId: string): Promise<{
  id: string;
  name: string;
  paymentRequired: boolean;
} | null> {
  const db = getDb();

  try {
    const result = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        paymentRequired: organizations.paymentRequired,
      })
      .from(apiKeys)
      .innerJoin(organizations, eq(apiKeys.organizationId, organizations.id))
      .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting API key organization:', error);
    return null;
  }
}

/**
 * Gets the owner user of an API key
 * @param apiKeyId The API key ID
 * @returns The user data if found, null otherwise
 */
export async function getOrganizationForApiKey(apiKeyId: string): Promise<{
  organizationId: string;
} | null> {
  const db = getDb();

  try {
    const result = await db
      .select({
        organizationId: apiKeys.organizationId,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, apiKeyId), isNull(apiKeys.deletedAt)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Error getting API key associated organization:', error);
    return null;
  }
}
