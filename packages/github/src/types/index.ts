import { z } from 'zod';

export const GitHubOAuthConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  scopes: z.array(z.string()).min(1),
});

export type GitHubOAuthConfig = z.infer<typeof GitHubOAuthConfigSchema>;

export const GitHubIntegrationResultSchema = z.object({
  installationId: z.string(),
  appId: z.string().optional(),
  githubOrgId: z.string(),
  githubOrgName: z.string().optional(),
  accessToken: z.string(),
  repositoryPermissions: z.record(z.unknown()).optional(),
});

export type GitHubIntegrationResult = z.infer<typeof GitHubIntegrationResultSchema>;

export const GitHubOAuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  scope: z.string(),
});

export type GitHubOAuthResponse = z.infer<typeof GitHubOAuthResponseSchema>;

export const GitHubOAuthStateSchema = z.object({
  expiresAt: z.number(),
  metadata: z.record(z.unknown()).optional(),
});

export type GitHubOAuthState = z.infer<typeof GitHubOAuthStateSchema>;
