export const GITHUB_OAUTH_SCOPES = [
  'repo',
  'workflow',
  'pull_requests',
] as const;

export type GitHubOAuthScope = (typeof GITHUB_OAUTH_SCOPES)[number];

export const GITHUB_APP_PERMISSIONS = {
  contents: 'write',
  pull_requests: 'write',
  actions: 'write',
  metadata: 'read',
} as const;
