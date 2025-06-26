import { z } from 'zod';
import { getClient } from './connection';

// Vault secret schema
export const VaultSecretSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  secret: z.string(), // This will contain the decrypted secret value
  key_id: z.string().uuid().nullable(),
  nonce: z.any().nullable(), // nonce can be various types in Supabase
  created_at: z.string(),
  updated_at: z.string(),
});

export type VaultSecret = z.infer<typeof VaultSecretSchema>;

// Input schemas
export const CreateSecretInputSchema = z.object({
  secret: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export type CreateSecretInput = z.infer<typeof CreateSecretInputSchema>;

export const UpdateSecretInputSchema = z.object({
  id: z.string().uuid(),
  secret: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export type UpdateSecretInput = z.infer<typeof UpdateSecretInputSchema>;

/**
 * Create a new secret in Supabase Vault
 */
export async function createSecret(input: CreateSecretInput): Promise<string> {
  const validatedInput = CreateSecretInputSchema.parse(input);
  const client = getClient();

  try {
    const result = await client`
      SELECT vault.create_secret(
        ${validatedInput.secret}::text,
        ${validatedInput.name || null}::text,
        ${validatedInput.description !== undefined ? validatedInput.description : ''}::text
      ) as id
    `;

    if (!result[0]?.id) {
      throw new Error('Failed to create secret: No ID returned');
    }

    return result[0].id;
  } catch (error) {
    throw new Error(
      `Failed to create vault secret: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update an existing secret in Supabase Vault
 */
export async function updateSecret(input: UpdateSecretInput): Promise<string> {
  const validatedInput = UpdateSecretInputSchema.parse(input);
  const client = getClient();

  try {
    // Note: vault.update_secret returns void, not an ID
    await client`
      SELECT vault.update_secret(
        ${validatedInput.id}::uuid,
        ${validatedInput.secret}::text,
        ${validatedInput.name || null}::text,
        ${validatedInput.description !== undefined ? validatedInput.description : null}::text
      )
    `;

    // Return the same ID that was passed in
    return validatedInput.id;
  } catch (error) {
    throw new Error(
      `Failed to update vault secret: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a secret from Supabase Vault
 */
export async function deleteSecret(id: string): Promise<void> {
  const validatedId = z.string().uuid().parse(id);
  const client = getClient();

  try {
    await client`
      DELETE FROM vault.secrets
      WHERE id = ${validatedId}::uuid
    `;
  } catch (error) {
    throw new Error(
      `Failed to delete vault secret: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get a decrypted secret by ID
 */
export async function getSecret(id: string): Promise<VaultSecret | null> {
  const validatedId = z.string().uuid().parse(id);
  const client = getClient();

  try {
    const result = await client`
      SELECT 
        id,
        name,
        description,
        decrypted_secret as secret,
        key_id,
        nonce,
        created_at,
        updated_at
      FROM vault.decrypted_secrets
      WHERE id = ${validatedId}::uuid
      LIMIT 1
    `;

    if (!result[0]) {
      return null;
    }

    return VaultSecretSchema.parse(result[0]);
  } catch (error) {
    throw new Error(
      `Failed to get vault secret: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get a decrypted secret by name
 */
export async function getSecretByName(name: string): Promise<VaultSecret | null> {
  const validatedName = z.string().parse(name);
  const client = getClient();

  try {
    const result = await client`
      SELECT 
        id,
        name,
        description,
        decrypted_secret as secret,
        key_id,
        nonce,
        created_at,
        updated_at
      FROM vault.decrypted_secrets
      WHERE name = ${validatedName}::text
      LIMIT 1
    `;

    if (!result[0]) {
      return null;
    }

    return VaultSecretSchema.parse(result[0]);
  } catch (error) {
    throw new Error(
      `Failed to get vault secret by name: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * List all decrypted secrets (with optional limit)
 */
export async function listSecrets(limit = 100): Promise<VaultSecret[]> {
  const validatedLimit = z.number().positive().max(1000).parse(limit);
  const client = getClient();

  try {
    const result = await client`
      SELECT 
        id,
        name,
        description,
        decrypted_secret as secret,
        key_id,
        nonce,
        created_at,
        updated_at
      FROM vault.decrypted_secrets
      ORDER BY created_at DESC
      LIMIT ${validatedLimit}
    `;

    return z.array(VaultSecretSchema).parse(result);
  } catch (error) {
    throw new Error(
      `Failed to list vault secrets: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
