// Re-export commonly used Octokit types for server usage
export type { WebhookEventName } from '@octokit/webhooks/types';
import type { InstallationCreatedEvent, InstallationDeletedEvent, InstallationSuspendEvent, InstallationUnsuspendEvent, InstallationNewPermissionsAcceptedEvent } from '@octokit/webhooks-types';


export type { App } from 'octokit';

// Client exports
export { createGitHubApp, getGitHubAppCredentials } from './client/app';

// Service exports
export { generateNewInstallationToken } from './services/token';

export type AnyInstallationEvent =  InstallationCreatedEvent | InstallationDeletedEvent | InstallationSuspendEvent | InstallationUnsuspendEvent | InstallationNewPermissionsAcceptedEvent;