import { type BusterSDK, createBusterSDK } from '@buster/sdk';
import { loadCredentials } from '../../../utils/credentials';
import type { DeployRequest, DeployResponse, DeploymentFailure, DeploymentItem } from '../schemas';

/**
 * Type definition for a deployment function
 */
export type DeployFunction = (request: DeployRequest) => Promise<DeployResponse>;

/**
 * Creates a dry-run deployer that simulates deployment without API calls
 * Pure function that returns another function - perfect for testing
 */
export function createDryRunDeployer(verbose = false): DeployFunction {
  return async (request: DeployRequest): Promise<DeployResponse> => {
    if (verbose) {
      console.info('[DRY RUN] Would deploy:');
      for (const model of request.models) {
        console.info(`  - ${model.name} to ${model.data_source_name}.${model.schema}`);
      }
    }

    // Simulate successful deployment for all models
    const successItems: DeploymentItem[] = request.models.map((model) => ({
      name: model.name,
      dataSource: model.data_source_name,
      schema: model.schema,
      database: model.database,
    }));

    return {
      success: successItems,
      updated: [],
      noChange: [],
      failures: [],
      deleted: [],
      summary: {
        totalModels: request.models.length,
        successCount: successItems.length,
        updateCount: 0,
        noChangeCount: 0,
        failureCount: 0,
        deletedCount: 0,
      },
    };
  };
}

/**
 * Creates a live deployer that makes actual API calls
 * This is a higher-order function that captures the SDK instance
 */
export function createLiveDeployer(sdk: BusterSDK): DeployFunction {
  return async (request: DeployRequest): Promise<DeployResponse> => {
    return sdk.datasets.deploy(request);
  };
}

/**
 * Creates an authenticated deployer by loading credentials and creating SDK
 * This is the only function that performs I/O in this module
 */
export async function createAuthenticatedDeployer(): Promise<DeployFunction> {
  const credentials = await loadCredentials();

  if (!credentials?.apiKey) {
    throw new Error('Not authenticated. Please run: buster auth');
  }

  const sdk = createBusterSDK({
    apiKey: credentials.apiKey,
    apiUrl: credentials.apiUrl || 'https://api.buster.so',
  });

  return createLiveDeployer(sdk);
}

/**
 * Creates a validation-only deployer that checks models without deploying
 * Useful for pre-deployment validation
 */
export function createValidationDeployer(): DeployFunction {
  return async (request: DeployRequest): Promise<DeployResponse> => {
    const failures: DeploymentFailure[] = [];
    const success: DeploymentItem[] = [];

    for (const model of request.models) {
      const errors: string[] = [];

      // Perform validation checks
      if (!model.name) errors.push('Model name is required');
      if (!model.data_source_name) errors.push('Data source name is required');
      if (!model.schema) errors.push('Schema is required');
      if (model.columns.length === 0) errors.push('At least one column is required');

      if (errors.length > 0) {
        failures.push({
          name: model.name || 'unknown',
          dataSource: model.data_source_name,
          errors,
        });
      } else {
        success.push({
          name: model.name,
          dataSource: model.data_source_name,
          schema: model.schema,
          database: model.database,
        });
      }
    }

    return {
      success,
      updated: [],
      noChange: [],
      failures,
      deleted: [],
      summary: {
        totalModels: request.models.length,
        successCount: success.length,
        updateCount: 0,
        noChangeCount: 0,
        failureCount: failures.length,
        deletedCount: 0,
      },
    };
  };
}

/**
 * Composes multiple deployers to run in sequence
 * Useful for validation + deployment chains
 */
export function composeDeployers(...deployers: DeployFunction[]): DeployFunction {
  return async (request: DeployRequest): Promise<DeployResponse> => {
    let lastResponse: DeployResponse | null = null;

    for (const deployer of deployers) {
      const response = await deployer(request);

      // If any deployer has failures, stop the chain
      if (response.failures.length > 0) {
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
  return async (request: DeployRequest): Promise<DeployResponse> => {
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
      success: [],
      updated: [],
      noChange: [],
      failures: request.models.map((model) => ({
        name: model.name,
        dataSource: model.data_source_name,
        errors: [lastError?.message || 'Deployment failed after retries'],
      })),
      deleted: [],
      summary: {
        totalModels: request.models.length,
        successCount: 0,
        updateCount: 0,
        noChangeCount: 0,
        failureCount: request.models.length,
        deletedCount: 0,
      },
    };
  };
}
