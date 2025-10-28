import type { deploy as deployTypes } from '@buster/server-shared';
import type { SDKConfig } from './config';
import { post } from './http';

type UnifiedDeployRequest = deployTypes.UnifiedDeployRequest;
type UnifiedDeployResponse = deployTypes.UnifiedDeployResponse;

/**
 * Deploy models and docs to the Buster API
 * Performs upserts on all items and soft-deletes items not included
 */
export async function deploy(
  config: SDKConfig,
  request: UnifiedDeployRequest
): Promise<UnifiedDeployResponse> {
  // The HTTP client will automatically add /api/v2 prefix
  return post<UnifiedDeployResponse>(config, '/deploy', request);
}
