import { type BusterSDK, createBusterSDK } from '@buster/sdk';
import type { deploy } from '@buster/server-shared';

type UnifiedDeployRequest = deploy.UnifiedDeployRequest;
type UnifiedDeployResponse = deploy.UnifiedDeployResponse;

import { getCredentials } from '../../../utils/credentials';
import type { DeploymentFailure, DeploymentItem } from '../schemas';

/**
 * Type definition for a deployment function
 * Now uses unified deploy request/response
 */
export type DeployFunction = (request: UnifiedDeployRequest) => Promise<UnifiedDeployResponse>;

/**
 * Creates a dry-run deployer that simulates deployment without API calls
 * Pure function that returns another function - perfect for testing
 */
export function createDryRunDeployer(verbose = false): DeployFunction {
  return async (request: UnifiedDeployRequest): Promise<UnifiedDeployResponse> => {
    if (verbose) {
      console.info('[DRY RUN] Would deploy:');
      console.info(`  Models:`);
      for (const model of request.models) {
        console.info(`    - ${model.name} to ${model.data_source_name}.${model.schema}`);
      }
      console.info(`  Docs:`);
      for (const doc of request.docs) {
        console.info(`    - ${doc.name} (${doc.type})`);
      }
    }

    // Simulate successful deployment for all items
    const modelSuccessItems: DeploymentItem[] = request.models.map((model) => ({
      name: model.name,
      dataSource: model.data_source_name,
      schema: model.schema,
      database: model.database,
    }));

    return {
      models: {
        success: modelSuccessItems,
        updated: [],
        failures: [],
        deleted: [],
        summary: {
          totalModels: request.models.length,
          successCount: modelSuccessItems.length,
          updateCount: 0,
          failureCount: 0,
          deletedCount: 0,
        },
      },
      docs: {
        created: request.docs.map((d) => d.name),
        updated: [],
        deleted: [],
        failed: [],
        summary: {
          totalDocs: request.docs.length,
          createdCount: request.docs.length,
          updatedCount: 0,
          deletedCount: 0,
          failedCount: 0,
        },
      },
    };
  };
}

/**
 * Creates a live deployer that makes actual API calls
 * This is a higher-order function that captures the SDK instance
 */
export function createLiveDeployer(sdk: BusterSDK): DeployFunction {
  return async (request: UnifiedDeployRequest): Promise<UnifiedDeployResponse> => {
    return sdk.deploy(request);
  };
}

/**
 * Creates an authenticated deployer by loading credentials and creating SDK
 * This is the only function that performs I/O in this module
 */
export async function createAuthenticatedDeployer(): Promise<DeployFunction> {
  // Use getCredentials which checks env vars first, then saved credentials
  const credentials = await getCredentials();

  if (!credentials?.apiKey) {
    const isCIEnvironment = process.env.CI || !process.stdin.isTTY;
    if (isCIEnvironment) {
      throw new Error(
        'Not authenticated. Please set BUSTER_API_KEY environment variable or use --api-key flag.'
      );
    }
    throw new Error('Not authenticated. Please run: buster auth');
  }

  const sdk = createBusterSDK({
    apiKey: credentials.apiKey,
    apiUrl: credentials.apiUrl || 'https://api2.buster.so',
  });

  return createLiveDeployer(sdk);
}

/**
 * Creates a validation-only deployer that checks models without deploying
 * Useful for pre-deployment validation
 */
export function createValidationDeployer(): DeployFunction {
  return async (request: UnifiedDeployRequest): Promise<UnifiedDeployResponse> => {
    const modelFailures: DeploymentFailure[] = [];
    const modelSuccess: DeploymentItem[] = [];

    for (const model of request.models) {
      const errors: string[] = [];

      // Perform validation checks
      if (!model.name) errors.push('Model name is required');
      if (!model.data_source_name) errors.push('Data source name is required');
      if (!model.schema) errors.push('Schema is required');
      if (model.columns.length === 0) errors.push('At least one column is required');

      if (errors.length > 0) {
        modelFailures.push({
          name: model.name || 'unknown',
          dataSource: model.data_source_name,
          errors,
        });
      } else {
        modelSuccess.push({
          name: model.name,
          dataSource: model.data_source_name,
          schema: model.schema,
          database: model.database,
        });
      }
    }

    const docFailures: Array<{ name: string; error: string }> = [];
    const docSuccess: string[] = [];

    for (const doc of request.docs) {
      if (!doc.name) {
        docFailures.push({ name: 'unknown', error: 'Doc name is required' });
      } else if (!doc.content) {
        docFailures.push({ name: doc.name, error: 'Doc content is required' });
      } else {
        docSuccess.push(doc.name);
      }
    }

    return {
      models: {
        success: modelSuccess,
        updated: [],
        failures: modelFailures,
        deleted: [],
        summary: {
          totalModels: request.models.length,
          successCount: modelSuccess.length,
          updateCount: 0,
          failureCount: modelFailures.length,
          deletedCount: 0,
        },
      },
      docs: {
        created: docSuccess,
        updated: [],
        deleted: [],
        failed: docFailures,
        summary: {
          totalDocs: request.docs.length,
          createdCount: docSuccess.length,
          updatedCount: 0,
          deletedCount: 0,
          failedCount: docFailures.length,
        },
      },
    };
  };
}

/**
 * Composes multiple deployers to run in sequence
 * Useful for validation + deployment chains
 */
export function composeDeployers(...deployers: DeployFunction[]): DeployFunction {
  return async (request: UnifiedDeployRequest): Promise<UnifiedDeployResponse> => {
    let lastResponse: UnifiedDeployResponse | null = null;

    for (const deployer of deployers) {
      const response = await deployer(request);

      // If any deployer has failures, stop the chain
      if (response.models.failures.length > 0 || response.docs.failed.length > 0) {
        return response;
      }

      lastResponse = response;
    }

    if (!lastResponse) {
      throw new Error('No deployers provided to chain');
    }

    return lastResponse;
  };
}

/**
 * Creates a deployer with retry logic for resilience
 */
export function createRetryableDeployer(
  deployer: DeployFunction,
  maxRetries = 3,
  delayMs = 1000
): DeployFunction {
  return async (request: UnifiedDeployRequest): Promise<UnifiedDeployResponse> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await deployer(request);
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          console.warn(`Deployment attempt ${attempt} failed, retrying in ${delayMs}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // If all retries failed, return a failure response
    return {
      models: {
        success: [],
        updated: [],
        failures: request.models.map((model) => ({
          name: model.name,
          errors: [lastError?.message || 'Deployment failed after retries'],
        })),
        deleted: [],
        summary: {
          totalModels: request.models.length,
          successCount: 0,
          updateCount: 0,
          failureCount: request.models.length,
          deletedCount: 0,
        },
      },
      docs: {
        created: [],
        updated: [],
        deleted: [],
        failed: request.docs.map((doc) => ({
          name: doc.name,
          error: lastError?.message || 'Deployment failed after retries',
        })),
        summary: {
          totalDocs: request.docs.length,
          createdCount: 0,
          updatedCount: 0,
          deletedCount: 0,
          failedCount: request.docs.length,
        },
      },
    };
  };
}
