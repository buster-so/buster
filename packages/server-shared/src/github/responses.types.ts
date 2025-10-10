import { z } from 'zod';

// GitHub Error Response
export const GitHubErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  documentation_url: z.string().optional(),
  status: z.number().optional(),
});

export type GitHubErrorResponse = z.infer<typeof GitHubErrorResponseSchema>;

// Response after successfully handling installation callback
export const InstallationCallbackResponseSchema = z.object({
  success: z.boolean(),
  integrationId: z.string().uuid(),
  message: z.string().optional(),
});

export type InstallationCallbackResponse = z.infer<typeof InstallationCallbackResponseSchema>;

// Response containing installation access token
export const InstallationTokenResponseSchema = z.object({
  token: z.string(),
  expires_at: z.string().datetime(), // ISO 8601 date string
  permissions: z.record(z.string()).optional(), // e.g., { "contents": "read", "issues": "write" }
  repository_selection: z.enum(['all', 'selected']).optional(),
  repositories: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        full_name: z.string(),
        private: z.boolean(),
      })
    )
    .optional(),
});

export type InstallationTokenResponse = z.infer<typeof InstallationTokenResponseSchema>;

// Response for checking GitHub integration status
export const GetGitHubIntegrationResponseSchema = z.object({
  connected: z.boolean(),
  status: z.enum(['pending', 'active', 'suspended', 'revoked']).optional(),
  integration: z
    .object({
      id: z.string().uuid(),
      github_org_name: z.string(),
      github_org_id: z.string(),
      installation_id: z.string(),
      installed_at: z.string().datetime(),
      last_used_at: z.string().datetime().optional(),
      repository_count: z.number().optional(),
    })
    .optional(),
});

export const AuthDetailsAppInstallationResponseSchema = z.object({
  type: z.literal('token'),
  tokenType: z.literal('installation'),
  token: z.string(),
  installationId: z.number(),
  permissions: z.record(z.string(), z.string()),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  repositorySelection: z.enum(['all', 'selected']),
});

export type AuthDetailsResponse = z.infer<typeof AuthDetailsAppInstallationResponseSchema>;

export type GetGitHubIntegrationResponse = z.infer<typeof GetGitHubIntegrationResponseSchema>;
