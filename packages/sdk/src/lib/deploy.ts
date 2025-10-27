import type { deploy as deployTypes } from '@buster/server-shared';
import type { SDKConfig } from './config';
import { post } from './http';

type UnifiedDeployRequest = deployTypes.UnifiedDeployRequest;
type UnifiedDeployResponse = deployTypes.UnifiedDeployResponse;
type ModelsDocsDeployRequest = deployTypes.ModelsDocsDeployRequest;
type AutomationDeployRequest = deployTypes.AutomationDeployRequest;

/**
 * Type guard to check if request is an AutomationDeployRequest
 */
function isAutomationDeployRequest(
  request: UnifiedDeployRequest
): request is AutomationDeployRequest {
  return 'automation' in request;
}

/**
 * Type guard to check if request is a ModelsDocsDeployRequest
 */
function isModelsDocsDeployRequest(
  request: UnifiedDeployRequest
): request is ModelsDocsDeployRequest {
  return 'models' in request || 'docs' in request || 'logsWriteback' in request;
}

/**
 * Deploy models and docs to the Buster API
 * Performs upserts on all items and soft-deletes items not included
 */
export async function deploy(
  config: SDKConfig,
  request: UnifiedDeployRequest
): Promise<UnifiedDeployResponse> {
  // The HTTP client will automatically add /api/v2 prefix

  // Route to the appropriate endpoint based on request type
  if (isAutomationDeployRequest(request)) {
    return post<UnifiedDeployResponse>(config, '/deploy/automation', request);
  }

  if (isModelsDocsDeployRequest(request)) {
    return post<UnifiedDeployResponse>(config, '/deploy/project', request);
  }

  // This should never happen if the union type is properly defined
  throw new Error(
    'Invalid deploy request: must contain either automation, models, docs, or logsWriteback'
  );
}
