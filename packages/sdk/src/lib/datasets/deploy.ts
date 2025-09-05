import type { DeployRequest, DeployResponse } from '@buster/server-shared';
import type { SDKConfig } from '../config';
import { get, post } from '../http';

/**
 * Deploy semantic models to the Buster API
 * Performs upserts on all models and soft-deletes models not included
 */
export async function deployDatasets(
  config: SDKConfig,
  request: DeployRequest
): Promise<DeployResponse> {
  // The HTTP client will automatically add /api/v2 prefix
  return post<DeployResponse>(config, '/datasets/deploy', request);
}

/**
 * Get datasets for the current organization
 */
export async function getDatasets(
  config: SDKConfig,
  dataSourceId?: string
): Promise<{ datasets: unknown[] }> {
  // The HTTP client will automatically add /api/v2 prefix
  const params = dataSourceId ? { dataSourceId } : undefined;
  return get<{ datasets: unknown[] }>(config, '/datasets', params);
}
