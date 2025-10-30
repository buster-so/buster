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
  getDataSourceWithDatasets,
  getSecret,
  getUserOrganizationId,
  updateDataSource,
  updateSecret,
} from '@buster/database/queries';
import {
  type Credentials,
  CredentialsSchema,
  type DataSourceType,
  type UpdateDataSourceRequest,
  type UpdateDataSourceResponse,
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
    default: {
      // Exhaustive check: This will cause a TypeScript error if a new type is added
      // to DataSourceType but not handled in the switch statement
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported data source type: ${exhaustiveCheck}`);
    }
  }
}

/**
 * Handler for updating a data source
 *
 * Flow:
 * 1. Get user's organization and verify membership
 * 2. Fetch existing data source with datasets (checks org access)
 * 3. Determine what's being updated (name, credentials, or both)
 * 4. If credentials are being updated, validate them
 * 5. Update secret in vault if credentials changed
 * 6. Update data source record in database
 * 7. Return updated data source with credentials
 */
export async function updateDataSourceHandler(
  user: User,
  dataSourceId: string,
  request: UpdateDataSourceRequest
): Promise<UpdateDataSourceResponse> {
  // Step 1: Get user's organization
  const userOrg = await getUserOrganizationId(user.id);

  if (!userOrg) {
    throw new HTTPException(403, {
      message: 'You must be part of an organization to update data sources',
    });
  }

  // Step 2: Check permissions (same as create)
  const allowedRoles = ['workspace_admin', 'data_admin'];
  if (!allowedRoles.includes(userOrg.role.toLowerCase())) {
    throw new HTTPException(403, {
      message: 'Insufficient permissions. DataAdmin or WorkspaceAdmin role required',
    });
  }

  // Step 3: Fetch existing data source
  const existingDataSource = await getDataSourceWithDatasets({
    id: dataSourceId,
    organizationId: userOrg.organizationId,
  });

  if (!existingDataSource) {
    throw new HTTPException(404, {
      message: 'Data source not found',
    });
  }

  // Step 4: Determine what's being updated
  const isUpdatingName = request.name !== undefined;
  const isUpdatingCredentials = request.type !== undefined;

  // If nothing to update
  if (!isUpdatingName && !isUpdatingCredentials) {
    // Return existing data source with current credentials
    const secret = await getSecret(existingDataSource.secretId);
    if (!secret) {
      throw new HTTPException(500, {
        message: 'Failed to retrieve data source credentials',
      });
    }

    const credentials = CredentialsSchema.parse(JSON.parse(secret.secret));

    return {
      id: existingDataSource.id,
      name: existingDataSource.name,
      type: existingDataSource.type,
      organizationId: existingDataSource.organizationId,
      createdBy: existingDataSource.createdBy,
      createdAt: existingDataSource.createdAt,
      updatedAt: existingDataSource.updatedAt,
      deletedAt: existingDataSource.deletedAt,
      onboardingStatus: existingDataSource.onboardingStatus as 'notStarted',
      onboardingError: existingDataSource.onboardingError,
      credentials,
      datasets: existingDataSource.datasets,
    };
  }

  // Step 5: If updating credentials, validate them
  let newCredentials: Credentials | undefined;
  let newSecretId: string | undefined;

  if (isUpdatingCredentials) {
    // Extract all credential fields from request (removing name field)
    const { name: _, ...credentialFields } = request;

    // Validate we have a complete credential set for the specified type
    const validationResult = CredentialsSchema.safeParse(credentialFields);

    if (!validationResult.success) {
      throw new HTTPException(400, {
        message: 'Invalid or incomplete credentials for the specified type',
      });
    }

    newCredentials = validationResult.data;

    // Validate credentials by testing connection
    let adapter: DataSourceAdapter | undefined;
    try {
      adapter = getAdapterForType(newCredentials.type);
      await adapter.initialize(newCredentials);
      const isValid = await adapter.testConnection();

      if (!isValid) {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[updateDataSource] Credential validation failed', {
        error: message,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        dataSourceType: newCredentials.type,
        dataSourceId,
      });
      throw new HTTPException(400, {
        message: `Invalid ${newCredentials.type} credentials: ${message}`,
      });
    } finally {
      if (adapter) {
        try {
          await adapter.close();
        } catch (closeError) {
          console.warn('[updateDataSource] Error closing adapter (non-fatal)', {
            error: closeError instanceof Error ? closeError.message : 'Unknown error',
          });
        }
      }
    }

    // Step 6: Update secret in vault
    try {
      newSecretId = await updateSecret({
        id: existingDataSource.secretId,
        secret: JSON.stringify(newCredentials),
        name: `data-source-${request.name || existingDataSource.name}-${Date.now()}`,
        description: `${newCredentials.type} credentials for data source: ${request.name || existingDataSource.name}`,
      });
    } catch (error) {
      console.error('[updateDataSource] Failed to update credentials', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        dataSourceId,
      });
      throw new HTTPException(500, {
        message: 'Failed to update credentials securely',
      });
    }
  }

  // Step 7: Update data source record
  try {
    await updateDataSource({
      id: dataSourceId,
      name: request.name,
      type: isUpdatingCredentials ? newCredentials?.type : undefined,
      secretId: newSecretId,
      updatedBy: user.id,
    });
  } catch (error) {
    console.error('[updateDataSource] Failed to update data source record', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      dataSourceId,
    });
    throw new HTTPException(500, {
      message: 'Failed to update data source',
    });
  }

  // Step 8: Fetch updated data source with datasets
  const updatedDataSource = await getDataSourceWithDatasets({
    id: dataSourceId,
    organizationId: userOrg.organizationId,
  });

  if (!updatedDataSource) {
    throw new HTTPException(500, {
      message: 'Failed to retrieve updated data source',
    });
  }

  // Step 9: Get credentials from vault
  const secret = await getSecret(updatedDataSource.secretId);
  if (!secret) {
    throw new HTTPException(500, {
      message: 'Failed to retrieve data source credentials',
    });
  }

  const credentials = CredentialsSchema.parse(JSON.parse(secret.secret));

  // Step 10: Return response
  return {
    id: updatedDataSource.id,
    name: updatedDataSource.name,
    type: updatedDataSource.type,
    organizationId: updatedDataSource.organizationId,
    createdBy: updatedDataSource.createdBy,
    createdAt: updatedDataSource.createdAt,
    updatedAt: updatedDataSource.updatedAt,
    deletedAt: updatedDataSource.deletedAt,
    onboardingStatus: updatedDataSource.onboardingStatus as 'notStarted',
    onboardingError: updatedDataSource.onboardingError,
    credentials,
    datasets: updatedDataSource.datasets,
  };
}
