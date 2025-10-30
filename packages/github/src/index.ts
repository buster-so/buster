// Re-export commonly used Octokit types for server usage
export type { WebhookEventName } from '@octokit/webhooks/types';
export type { App, Octokit } from 'octokit';

import type { WebhookEventDefinition } from '@octokit/webhooks/types';

export type InstallationWebhookEvents =
  | WebhookEventDefinition<'installation-deleted'>
  | WebhookEventDefinition<'installation-new-permissions-accepted'>
  | WebhookEventDefinition<'installation-suspend'>
  | WebhookEventDefinition<'installation-unsuspend'>
  | WebhookEventDefinition<'installation-created'>;

export type IssueCommentCreatedWebhookEvent = WebhookEventDefinition<'issue-comment-created'>;

export type PullRequestWebhookEvent =
  | WebhookEventDefinition<'pull-request-opened'>
  | WebhookEventDefinition<'pull-request-reopened'>
  | WebhookEventDefinition<'pull-request-synchronize'>;

export type PullRequestSynchronizeWebhookEvent = WebhookEventDefinition<'pull-request-synchronize'>;

export type PushWebhookEvent = WebhookEventDefinition<'push'>;

// Client exports
export { createGitHubApp, getGitHubAppCredentials } from './client/app';
export { createInstallationOctokit } from './services/installation';
// Service exports
export { generateNewInstallationToken } from './services/token';

// Type exports
export type { ChecksCreateParams, ChecksGetParams, ChecksUpdateParams } from './types';
