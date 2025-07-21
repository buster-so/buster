import { z } from 'zod';
export const GitHubOAuthConfigSchema = z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    redirectUri: z.string().url(),
    scopes: z.array(z.string()).min(1),
});
export const GitHubIntegrationResultSchema = z.object({
    installationId: z.string(),
    appId: z.string().optional(),
    githubOrgId: z.string(),
    githubOrgName: z.string().optional(),
    accessToken: z.string(),
    repositoryPermissions: z.record(z.unknown()).optional(),
});
export const GitHubOAuthResponseSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    scope: z.string(),
});
export const GitHubOAuthStateSchema = z.object({
    expiresAt: z.number(),
    metadata: z.record(z.unknown()).optional(),
});
