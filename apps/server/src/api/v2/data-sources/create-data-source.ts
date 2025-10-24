import { DataSourceType, MotherDuckAdapter } from '@buster/data-source';
import type { User } from '@buster/database/queries';
import {
  checkDataSourceNameExists,
  createDataSource,
  createSecret,
  getUser,
  getUserOrganizationId,
} from '@buster/database/queries';
import type { CreateDataSourceRequest, CreateDataSourceResponse } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

/**
 * Handler for creating a new data source (MotherDuck only for now)
 *
 * Flow:
 * 1. Get user's organization and verify membership
 * 2. Check user has required role (DataAdmin or WorkspaceAdmin)
 * 3. Verify data source name is unique in organization
 * 4. Validate MotherDuck credentials by testing connection
 * 5. Store credentials in vault
 * 6. Create data source record
 * 7. Return response with creator info
 */
export async function createDataSourceHandler(
  user: User,
  request: CreateDataSourceRequest
): Promise<CreateDataSourceResponse> {
  // Step 1: Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to create data sources',
    });
  }

  // Step 2: Check permissions
  const allowedRoles = ['workspace_admin', 'data_admin'];
  if (!allowedRoles.includes(userOrg.role.toLowerCase())) {
    throw new HTTPException(403, {
      message: 'Insufficient permissions. DataAdmin or WorkspaceAdmin role required',
    });
  }

  // Step 3: Check name uniqueness
  const existing = await checkDataSourceNameExists({
    name: request.name,
    organizationId: userOrg.organizationId,
  });

  if (existing) {
    throw new HTTPException(409, {
      message: `Data source with name '${request.name}' already exists in your organization`,
    });
  }

  // Step 4: Validate MotherDuck credentials
  const credentials = {
    type: DataSourceType.MotherDuck as const,
    token: request.token,
    default_database: request.default_database,
    saas_mode: request.saas_mode ?? true,
    ...(request.attach_mode && { attach_mode: request.attach_mode }),
    ...(request.connection_timeout && { connection_timeout: request.connection_timeout }),
    ...(request.query_timeout && { query_timeout: request.query_timeout }),
  };

  let adapter: MotherDuckAdapter | undefined;
  try {
    adapter = new MotherDuckAdapter();
    await adapter.initialize(credentials);
    const isValid = await adapter.testConnection();

    if (!isValid) {
      throw new Error('Connection test failed');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[createDataSource] MotherDuck credential validation failed', {
      error: message,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw new HTTPException(400, {
      message: `Invalid MotherDuck credentials: ${message}`,
    });
  } finally {
    // Always close the adapter connection
    if (adapter) {
      try {
        await adapter.close();
      } catch (closeError) {
        console.warn('[createDataSource] Error closing adapter (non-fatal)', {
          error: closeError instanceof Error ? closeError.message : 'Unknown error',
        });
      }
    }
  }

  // Step 5: Store credentials in vault
  let secret: string;
  try {
    secret = await createSecret({
      secret: JSON.stringify(credentials),
      name: `data-source-${request.name}-${Date.now()}`,
      description: `MotherDuck credentials for data source: ${request.name}`,
    });
  } catch (error) {
    console.error('[createDataSource] Failed to store credentials', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw new HTTPException(500, {
      message: 'Failed to store credentials securely',
    });
  }

  // Step 6: Create data source record
  let dataSource: Awaited<ReturnType<typeof createDataSource>>;
  try {
    dataSource = await createDataSource({
      name: request.name,
      type: 'motherduck',
      organizationId: userOrg.organizationId,
      createdBy: user.id,
      secretId: secret,
    });
  } catch (error) {
    console.error('[createDataSource] Failed to create data source record', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw new HTTPException(500, {
      message: 'Failed to create data source',
    });
  }

  // Step 7: Get creator info for response
  const creator = await getUser({ id: user.id });

  if (!creator) {
    // This should never happen since we're using the authenticated user
    throw new HTTPException(500, {
      message: 'Failed to retrieve user information',
    });
  }

  // Step 8: Build and return response
  return {
    id: dataSource.id,
    name: dataSource.name,
    type: dataSource.type,
    organizationId: dataSource.organizationId,
    createdBy: {
      id: creator.id,
      email: creator.email,
      name: creator.name || '',
    },
    createdAt: dataSource.createdAt,
    updatedAt: dataSource.updatedAt,
    deletedAt: dataSource.deletedAt,
    onboardingStatus: dataSource.onboardingStatus as 'notStarted',
    onboardingError: dataSource.onboardingError,
  };
}
