import type { User } from '@buster/database/queries';
import {
  getDataSourceWithDatasets,
  getSecret,
  getUserOrganizationId,
} from '@buster/database/queries';
import {
  type Credentials,
  CredentialsSchema,
  type GetDataSourceResponse,
  sanitizeCredentials,
} from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for getting a single data source by ID
 *
 * Flow:
 * 1. Get user's organization and verify membership
 * 2. Fetch data source with datasets (checks org access)
 * 3. Fetch credentials from vault
 * 4. Combine and return full response
 */
export async function getDataSourceHandler(
  user: User,
  dataSourceId: string
): Promise<GetDataSourceResponse> {
  // Step 1: Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to view data sources',
    });
  }

  // Step 2: Get data source with datasets
  const dataSource = await getDataSourceWithDatasets({
    id: dataSourceId,
    organizationId: userOrg.organizationId,
  });

  if (!dataSource) {
    throw new HTTPException(404, {
      message: 'Data source not found',
    });
  }

  // Step 3: Fetch credentials from vault
  const secret = await getSecret(dataSource.secretId);

  if (!secret) {
    // This should rarely happen - log for investigation
    console.error('[getDataSource] Secret not found in vault', {
      dataSourceId,
      secretId: dataSource.secretId,
    });
    throw new HTTPException(500, {
      message: 'Failed to retrieve data source credentials',
    });
  }

  // Step 4: Parse and validate credentials
  let credentials: Credentials;
  try {
    const parsedCredentials = JSON.parse(secret.secret);
    const validationResult = CredentialsSchema.safeParse(parsedCredentials);

    if (!validationResult.success) {
      console.error('[getDataSource] Invalid credentials format in vault', {
        dataSourceId,
        secretId: dataSource.secretId,
        error: validationResult.error,
      });
      throw new Error('Invalid credentials format');
    }

    credentials = validationResult.data;
  } catch (error) {
    console.error('[getDataSource] Failed to parse credentials', {
      dataSourceId,
      secretId: dataSource.secretId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new HTTPException(500, {
      message: 'Failed to parse data source credentials',
    });
  }

  // Step 5: Build and return response with sanitized credentials
  return {
    id: dataSource.id,
    name: dataSource.name,
    type: dataSource.type,
    organizationId: dataSource.organizationId,
    createdBy: dataSource.createdBy,
    createdAt: dataSource.createdAt,
    updatedAt: dataSource.updatedAt,
    deletedAt: dataSource.deletedAt,
    onboardingStatus: dataSource.onboardingStatus as 'notStarted',
    onboardingError: dataSource.onboardingError,
    credentials: sanitizeCredentials(credentials),
    datasets: dataSource.datasets,
  };
}
