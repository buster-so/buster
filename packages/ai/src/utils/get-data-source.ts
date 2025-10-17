import type { Credentials } from '@buster/data-source';
import { DataSource } from '@buster/data-source';
import { db } from '@buster/database/connection';
import { sql } from 'drizzle-orm';

/**
 * Get data source credentials from vault
 */
export async function getDataSourceCredentials(dataSourceId: string): Promise<Credentials> {
  try {
    // Query the vault to get the credentials
    const secretResult = await db.execute(
      sql`SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ${dataSourceId} LIMIT 1`
    );

    if (!secretResult.length || !secretResult[0]?.decrypted_secret) {
      throw new Error('No credentials found for the specified data source');
    }

    const secretString = secretResult[0].decrypted_secret as string;

    // Parse the credentials JSON
    const credentials = JSON.parse(secretString) as Credentials;
    return credentials;
  } catch (error) {
    console.error('Error getting data source credentials:', error);

    throw new Error(
      `Unable to retrieve data source credentials: ${error instanceof Error ? error.message : 'Unknown error occurred'}. Please contact support if this issue persists.`
    );
  }
}

/**
 * Create a DataSource instance for the given data source ID.
 * This is a simple helper that creates a new DataSource each time it's called.
 * The DataSource handles its own connection pooling internally.
 *
 * Important: Remember to call dataSource.close() when done to clean up connections.
 */
export async function getDataSource(dataSourceId: string): Promise<DataSource> {
  const credentials = await getDataSourceCredentials(dataSourceId);

  const dataSource = new DataSource({
    dataSources: [
      {
        name: `datasource-${dataSourceId}`,
        type: credentials.type,
        credentials: credentials,
      },
    ],
    defaultDataSource: `datasource-${dataSourceId}`,
  });

  return dataSource;
}
