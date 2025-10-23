// Re-export commonly used Octokit types for server usage
export type { WebhookEventName } from '@octokit/webhooks/types';

import type { WebhookEventDefinition } from '@octokit/webhooks/types';

export type InstallationWebhookEvents =
  | WebhookEventDefinition<'installation-deleted'>
  | WebhookEventDefinition<'installation-new-permissions-accepted'>
  | WebhookEventDefinition<'installation-suspend'>
  | WebhookEventDefinition<'installation-unsuspend'>
  | WebhookEventDefinition<'installation-created'>;

export type { App } from 'octokit';

// Client exports
export { createGitHubApp, getGitHubAppCredentials } from './client/app';

// Service exports
export { generateNewInstallationToken } from './services/token';
