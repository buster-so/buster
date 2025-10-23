import { z } from 'zod';

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

// Response schemas for GitHub Action Documentation endpoints
export const GithubActionDocumentationStatusSchema = z.object({
  messageId: z.string().describe('Message ID that was requested'),
  status: z
    .enum(['Complete', 'Failed', 'InProgress'])
    .describe('Current status of the documentation generation'),
  errorReason: z.string().optional().describe('Error reason when status is Failed'),
});

export type GithubActionDocumentationStatusResponse = z.infer<
  typeof GithubActionDocumentationStatusSchema
>;

export const AppInstallResponseSchema = z.object({
  redirectUrl: z.string(),
});

export type AppInstallResponse = z.infer<typeof AppInstallResponseSchema>;

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
      status: z.enum(['pending', 'active', 'suspended', 'revoked']),
    })
    .optional(),
});

export type GetGitHubIntegrationResponse = z.infer<typeof GetGitHubIntegrationResponseSchema>;