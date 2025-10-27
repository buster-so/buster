import {
  BigQueryAdapter,
  MotherDuckAdapter,
  MySQLAdapter,
  PostgreSQLAdapter,
  RedshiftAdapter,
  SnowflakeAdapter,
  SQLServerAdapter,
} from '@buster/data-source';
import type { User } from '@buster/database/queries';
import {
  checkDataSourceNameExists,
  createDataSource,
  createSecret,
  getUser,
  getUserOrganizationId,
} from '@buster/database/queries';
import type {
  CreateDataSourceRequest,
  CreateDataSourceResponse,
  DataSourceType,
} from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';

// Type for data source adapters
interface DataSourceAdapter {
  // biome-ignore lint/suspicious/noExplicitAny: Each adapter has its own specific credential type from its package
  initialize(credentials: any): Promise<void>;
  testConnection(): Promise<boolean>;
  close(): Promise<void>;
}

/**
 * Get the appropriate adapter for a data source type
 * Uses exhaustive type checking to ensure all data source types are handled
 */
function getAdapterForType(type: DataSourceType): DataSourceAdapter {
  switch (type) {
    case 'postgres':
      return new PostgreSQLAdapter();
    case 'mysql':
      return new MySQLAdapter();
    case 'bigquery':
      return new BigQueryAdapter();
    case 'snowflake':
      return new SnowflakeAdapter();
    case 'sqlserver':
      return new SQLServerAdapter();
    case 'redshift':
      return new RedshiftAdapter();
    case 'motherduck':
      return new MotherDuckAdapter();
    case 'databricks':
      // TODO: Add Databricks adapter when available
      throw new Error('Databricks adapter not yet implemented');
    default: {
      // Exhaustive check: This will cause a TypeScript error if a new type is added
      // to DataSourceType but not handled in the switch statement
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported data source type: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Handler for creating a new data source
 *
 * Flow:
 * 1. Get user's organization and verify membership
 * 2. Check user has required role (DataAdmin or WorkspaceAdmin)
 * 3. Verify data source name is unique in organization
 * 4. Validate credentials by testing connection
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

  // Step 4: Extract credentials from request (excluding name field)
  const { name: _, ...credentials } = request;

  // Step 5: Validate credentials by testing connection
  let adapter: DataSourceAdapter | undefined;
  try {
    adapter = getAdapterForType(request.type);
    await adapter.initialize(credentials);
    const isValid = await adapter.testConnection();

    if (!isValid) {
      throw new Error('Connection test failed');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[createDataSource] Credential validation failed', {
      error: message,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      dataSourceType: request.type,
    });
    throw new HTTPException(400, {
      message: `Invalid ${request.type} credentials: ${message}`,
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

  // Step 6: Store credentials in vault
  let secret: string;
  try {
    secret = await createSecret({
      secret: JSON.stringify(credentials),
      name: `data-source-${request.name}-${Date.now()}`,
      description: `${request.type} credentials for data source: ${request.name}`,
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

  // Step 7: Create data source record
  let dataSource: Awaited<ReturnType<typeof createDataSource>>;
  try {
    dataSource = await createDataSource({
      name: request.name,
      type: request.type,
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

  // Step 8: Get creator info for response
  const creator = await getUser({ id: user.id });

  if (!creator) {
    // This should never happen since we're using the authenticated user
    throw new HTTPException(500, {
      message: 'Failed to retrieve user information',
    });
  }

  // Step 9: Build and return response
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
