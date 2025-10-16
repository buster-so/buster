import { type Credentials, createAdapter, toCredentials } from '@buster/data-source';
import { db } from '@buster/database/connection';
import type { User } from '@buster/database/queries';
import {
  deleteLogsWriteBackConfig,
  getDataSourceByName,
  getDataSourceCredentials,
  getUserOrganizationId,
  upsertDataset,
  upsertDoc,
  upsertLogsWriteBackConfig,
} from '@buster/database/queries';
import { dataSources } from '@buster/database/schema';
import type { deploy } from '@buster/server-shared';
import { and, eq, isNull } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

type UnifiedDeployRequest = deploy.UnifiedDeployRequest;
type UnifiedDeployResponse = deploy.UnifiedDeployResponse;
type ModelDeployResult = deploy.ModelDeployResult;
type DocDeployResult = deploy.DocDeployResult;
type LogsWritebackResult = deploy.LogsWritebackResult;

/**
 * Deploy handler for unified model and doc deployment
 * Orchestrates deployment using simple database operations
 */
export async function deployHandler(
  request: UnifiedDeployRequest,
  user: User
): Promise<UnifiedDeployResponse> {
  // Get user's organization
  const userOrg = await getUserOrganizationId(user.id);
  if (!userOrg || !userOrg.organizationId) {
    throw new HTTPException(401, {
      message: 'User is not associated with an organization',
    });
  }

  // Check permissions
  if (userOrg.role !== 'workspace_admin' && userOrg.role !== 'data_admin') {
    throw new HTTPException(403, {
      message: 'Insufficient permissions. Only workspace admins and data admins can deploy.',
    });
  }

  try {
    // Use a transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      const modelResult: ModelDeployResult = {
        success: [],
        updated: [],
        failures: [],
        deleted: [],
        summary: {
          totalModels: request.models.length,
          successCount: 0,
          updateCount: 0,
          failureCount: 0,
          deletedCount: 0,
        },
      };

      const docResult: DocDeployResult = {
        created: [],
        updated: [],
        deleted: [],
        failed: [],
        summary: {
          totalDocs: request.docs.length,
          createdCount: 0,
          updatedCount: 0,
          deletedCount: 0,
          failedCount: 0,
        },
      };

      // Deploy models
      for (const model of request.models) {
        try {
          // Get data source ID
          const dataSource = await getDataSourceByName(
            tx,
            model.data_source_name,
            userOrg.organizationId
          );

          if (!dataSource) {
            modelResult.failures.push({
              name: model.name,
              errors: [`Data source '${model.data_source_name}' not found`],
            });
            modelResult.summary.failureCount++;
            continue;
          }

          // Transform model to dataset params (columns are deprecated)
          const datasetParams = {
            name: model.name,
            dataSourceId: dataSource.id,
            organizationId: userOrg.organizationId,
            database: model.database,
            schema: model.schema,
            description: model.description,
            sql_definition: model.sql_definition,
            yml_file: model.yml_file,
            userId: user.id,
          };

          // Upsert the dataset
          const { updated } = await upsertDataset(datasetParams);

          if (updated) {
            modelResult.updated.push({
              name: model.name,
              dataSource: model.data_source_name,
            });
            modelResult.summary.updateCount++;
          } else {
            modelResult.success.push({
              name: model.name,
              dataSource: model.data_source_name,
            });
            modelResult.summary.successCount++;
          }
        } catch (error) {
          console.error(`Failed to deploy model ${model.name}:`, error);
          modelResult.failures.push({
            name: model.name,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          });
          modelResult.summary.failureCount++;
        }
      }

      // Deploy docs
      for (const doc of request.docs) {
        try {
          const docParams = {
            name: doc.name,
            content: doc.content,
            type: doc.type as 'analyst' | 'normal',
            organizationId: userOrg.organizationId,
          };

          await upsertDoc(docParams);

          // Check if it was created or updated (simplified - we'd need to track this)
          docResult.created.push(doc.name);
          docResult.summary.createdCount++;
        } catch (error) {
          console.error(`Failed to deploy doc ${doc.name}:`, error);
          docResult.failed.push({
            name: doc.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          docResult.summary.failedCount++;
        }
      }

      // TODO: Handle soft deletion of absent models/docs if requested
      // This would require additional database functions to:
      // 1. List all current models for the data sources
      // 2. Soft delete those not in the deployment list
      // if (request.deleteAbsentModels) { ... }
      // if (request.deleteAbsentDocs) { ... }

      // Handle logs writeback configuration
      // Always call this to handle both presence and absence of logs config
      const logsWritebackResult = await handleLogsWritebackConfig(
        request.logsWriteback,
        userOrg.organizationId,
        tx
      );

      return {
        models: modelResult,
        docs: docResult,
        logsWriteback: logsWritebackResult,
      };
    });

    return result;
  } catch (error) {
    console.error('[deployHandler] Deployment failed:', error);

    // Re-throw HTTPExceptions as-is
    if (error instanceof HTTPException) {
      throw error;
    }

    // Wrap other errors
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : 'Deployment failed',
    });
  }
}

/**
 * Handle logs writeback configuration
 */
async function handleLogsWritebackConfig(
  config: deploy.LogsWritebackConfig | undefined,
  organizationId: string,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<LogsWritebackResult> {
  try {
    // If config is undefined, null, or disabled, delete existing configuration
    // This handles the case where logs section is removed from buster.yml
    if (!config || !config.enabled) {
      const deleted = await deleteLogsWriteBackConfig(organizationId);

      if (deleted) {
        console.info('Logs writeback configuration removed (soft deleted)');
      }

      return {
        configured: false,
        error: deleted ? undefined : 'No existing configuration to remove',
      };
    }

    // Get the appropriate data source for logs writeback
    let dataSource: Awaited<ReturnType<typeof getDataSourceByName>> | undefined;

    if (config.dataSource) {
      // Use the specified data source
      dataSource = await getDataSourceByName(tx, config.dataSource, organizationId);

      if (!dataSource) {
        return {
          configured: false,
          error: `Data source '${config.dataSource}' not found`,
        };
      }
    } else {
      // Get the first available data source for the organization
      // Prefer Snowflake, but accept any data source type
      const [firstDataSource] = await tx
        .select()
        .from(dataSources)
        .where(and(eq(dataSources.organizationId, organizationId), isNull(dataSources.deletedAt)))
        .orderBy(dataSources.type) // This will prioritize alphabetically, so BigQuery, MySQL, PostgreSQL, Redshift, Snowflake, SQLServer
        .limit(1);

      dataSource = firstDataSource;
    }

    if (!dataSource) {
      return {
        configured: false,
        error: 'No data source found for organization',
      };
    }

    // Upsert the configuration
    await upsertLogsWriteBackConfig({
      organizationId,
      dataSourceId: dataSource.id,
      database: config.database,
      schema: config.schema,
      tableName: config.tableName || 'buster_query_logs',
    });

    // Get credentials and create adapter to check/create table
    const credentials = await getDataSourceCredentials({
      dataSourceId: dataSource.id,
    });

    if (!credentials) {
      return {
        configured: true,
        database: config.database,
        schema: config.schema,
        tableName: config.tableName || 'buster_query_logs',
        error: 'Could not retrieve data source credentials',
      };
    }

    // Verify adapter supports logs writeback
    // Safely validate and convert credentials
    let validatedCredentials: Credentials;
    try {
      validatedCredentials = toCredentials(credentials);
    } catch (error) {
      return {
        configured: true,
        database: config.database,
        schema: config.schema,
        tableName: config.tableName || 'buster_query_logs',
        error: `Invalid credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    const adapter = await createAdapter(validatedCredentials);

    try {
      await adapter.initialize(validatedCredentials);

      // Just verify the adapter supports insertLogRecord
      if (!adapter.insertLogRecord) {
        return {
          configured: false,
          error: 'Data source type does not support logs writeback',
        };
      }

      return {
        configured: true,
        database: config.database,
        schema: config.schema,
        tableName: config.tableName || 'buster_query_logs',
      };
    } finally {
      // Clean up adapter connection
      await adapter.close();
    }
  } catch (error) {
    console.error('Failed to configure logs writeback:', error);
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Configuration failed',
    };
  }
}
