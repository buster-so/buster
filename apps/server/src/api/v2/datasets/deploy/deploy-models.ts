import { deployDatasetsBatch } from '@buster/database';
import type {
  DeployRequest,
  DeployResponse,
  DeploymentFailure,
  DeploymentItem,
} from '@buster/server-shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { validateModel } from './validate-model';

/**
 * Deploy all models using a single transaction for atomicity
 * Models are pre-validated on the CLI side, so this focuses on database operations
 */
export async function deployModels(
  request: DeployRequest,
  userId: string,
  organizationId: string,
  db: PostgresJsDatabase
): Promise<DeployResponse> {
  const startTime = Date.now();

  console.info(
    `[deployModels] Starting deployment of ${request.models.length} models for organization ${organizationId}`
  );

  // Quick validation check (models should already be validated by CLI)
  const validationFailures: DeploymentFailure[] = [];
  for (const model of request.models) {
    const errors = validateModel(model);
    if (errors.length > 0) {
      validationFailures.push({
        name: model.name,
        dataSource: model.data_source_name,
        errors,
      });
    }
  }

  if (validationFailures.length > 0) {
    console.error(`[deployModels] ${validationFailures.length} models failed validation`);
    return {
      success: [],
      updated: [],
      noChange: [],
      failures: validationFailures,
      deleted: [],
      summary: {
        totalModels: request.models.length,
        successCount: 0,
        updateCount: 0,
        noChangeCount: 0,
        failureCount: validationFailures.length,
        deletedCount: 0,
      },
    };
  }

  // Execute batch deployment in transaction
  // Cast to unknown first to handle type mismatch between server-shared and database's local types
  const batchResult = await deployDatasetsBatch(
    db,
    request.models as unknown as Parameters<typeof deployDatasetsBatch>[1],
    userId,
    organizationId,
    request.deleteAbsentModels !== false
  );

  // Transform batch result to DeployResponse format
  const success: DeploymentItem[] = [];
  const updated: DeploymentItem[] = [];
  const failures: DeploymentFailure[] = [];

  for (const item of batchResult.successes) {
    const model = request.models.find((m) => m.name === item.name);
    if (!model) continue;

    const deploymentItem: DeploymentItem = {
      name: item.name,
      dataSource: item.dataSource,
      schema: model.schema,
      database: model.database,
    };

    if (item.updated) {
      updated.push(deploymentItem);
    } else {
      success.push(deploymentItem);
    }
  }

  for (const failure of batchResult.failures) {
    failures.push({
      name: failure.name,
      dataSource: failure.dataSource,
      errors: [failure.error],
    });
  }

  const duration = Date.now() - startTime;
  console.info(`[deployModels] Deployment completed in ${duration}ms`);
  console.info(
    `[deployModels] Summary: ${success.length} created, ${updated.length} updated, ${failures.length} failed, ${batchResult.deleted.length} deleted`
  );

  return {
    success,
    updated,
    noChange: [],
    failures,
    deleted: batchResult.deleted,
    summary: {
      totalModels: request.models.length,
      successCount: success.length,
      updateCount: updated.length,
      noChangeCount: 0,
      failureCount: failures.length,
      deletedCount: batchResult.deleted.length,
    },
  };
}
