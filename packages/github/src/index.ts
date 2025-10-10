// Client exports
export { createGitHubApp, getGitHubAppCredentials } from './client/app';

// Service exports
export {
  getInstallationToken,
  getInstallationTokenByOrgId,
  verifyInstallationOwnership,
  storeInstallationToken,
  retrieveInstallationToken,
  deleteInstallationToken,
  isTokenExpired,
  generateTokenVaultKey,
  generateNewInstallationToken,
} from './services/token';

export {
  verifyGitHubWebhookSignature,
  extractGitHubWebhookSignature,
  verifyGitHubWebhook,
} from './services/webhook';

// Re-export types from server-shared for convenience
export * from '@buster/server-shared/github';

// Re-export commonly used Octokit types for server usage
export type { App } from 'octokit';

// Define webhook event name type (used for x-github-event header)
export type { WebhookEventName } from '@octokit/webhooks/types';
