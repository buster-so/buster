import type { DeployRequest, DeployResponse, ValidateApiKeyResponse } from '@buster/server-shared';
import { isApiKeyValid, validateApiKey } from '../auth';
import { type SDKConfig, SDKConfigSchema } from '../config';
import { deployDatasets, getDatasets } from '../datasets';
import { get } from '../http';

// SDK instance interface
export interface BusterSDK {
  readonly config: SDKConfig;
  healthcheck: () => Promise<{ status: string; [key: string]: unknown }>;
  auth: {
    validateApiKey: (apiKey?: string) => Promise<ValidateApiKeyResponse>;
    isApiKeyValid: (apiKey?: string) => Promise<boolean>;
  };
  datasets: {
    deploy: (request: DeployRequest) => Promise<DeployResponse>;
    get: (dataSourceId?: string) => Promise<{ datasets: unknown[] }>;
  };
}

// Create SDK instance
export function createBusterSDK(config: Partial<SDKConfig>): BusterSDK {
  // Validate config with Zod
  const validatedConfig = SDKConfigSchema.parse(config);

  return {
    config: validatedConfig,
    healthcheck: () => get(validatedConfig, '/healthcheck'),
    auth: {
      validateApiKey: (apiKey?: string) => validateApiKey(validatedConfig, apiKey),
      isApiKeyValid: (apiKey?: string) => isApiKeyValid(validatedConfig, apiKey),
    },
    datasets: {
      deploy: (request: DeployRequest) => deployDatasets(validatedConfig, request),
      get: (dataSourceId?: string) => getDatasets(validatedConfig, dataSourceId),
    },
  };
}
