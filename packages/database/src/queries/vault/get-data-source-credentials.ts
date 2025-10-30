import { z } from 'zod';
import type { Credentials } from '../../schema-types/credentials';
import { CredentialsSchema } from '../../schema-types/credentials';
import { getDataSourceById } from '../data-sources/get-data-source-by-id';
import { getSecret } from './vault';

export const GetDataSourceCredentialsInputSchema = z.object({
  dataSourceId: z.string().min(1, 'Data source ID is required'),
});

export type GetDataSourceCredentialsInput = z.infer<typeof GetDataSourceCredentialsInputSchema>;

/**
 * Retrieves and validates decrypted credentials from the vault for a data source
 * @param input - Contains the data source ID to retrieve credentials for
 * @returns Fully validated and typed credentials object
 * @throws Error if data source not found, credentials not found, invalid JSON, or fail schema validation
 */
export async function getDataSourceCredentials(
  input: GetDataSourceCredentialsInput
): Promise<Credentials> {
  const validated = GetDataSourceCredentialsInputSchema.parse(input);

  try {
    // Step 1: Get the data source to retrieve its secret ID
    const dataSource = await getDataSourceById(validated.dataSourceId);

    if (!dataSource) {
      throw new Error(`Data source not found with ID: ${validated.dataSourceId}`);
    }

    // Step 2: Retrieve the secret from vault using the secret ID
    const vaultSecret = await getSecret(dataSource.secretId);

    if (!vaultSecret) {
      throw new Error(
        `No credentials found in vault for data source ID: ${validated.dataSourceId} (secret ID: ${dataSource.secretId})`
      );
    }

    // Step 3: Parse the decrypted secret JSON
    let parsedSecret: unknown;
    try {
      parsedSecret = JSON.parse(vaultSecret.secret);
    } catch {
      // Don't log the parse error as it may contain sensitive credential information
      throw new Error(
        `Failed to parse credentials for data source ID ${validated.dataSourceId}: Invalid JSON format`
      );
    }

    // Step 4: Validate against Credentials schema
    try {
      const credentials = CredentialsSchema.parse(parsedSecret);
      return credentials;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid credential format for data source ID ${validated.dataSourceId}: ${error.message}`
        );
      }
      throw error;
    }
  } catch (error) {
    // Re-throw with more context if it's not our error
    if (
      error instanceof Error &&
      !error.message.includes('Data source not found') &&
      !error.message.includes('No credentials found') &&
      !error.message.includes('Failed to parse') &&
      !error.message.includes('Invalid credential format')
    ) {
      throw new Error(
        `Database error retrieving credentials for data source ID ${validated.dataSourceId}: ${error.message}`
      );
    }
    throw error;
  }
}
