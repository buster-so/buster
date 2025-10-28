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

// GitHub Check Run Response Schemas
export const CheckRunResponseSchema = z.object({
  check_run: z
    .object({
      id: z.number(),
      node_id: z.string(),
      head_sha: z.string(),
      external_id: z.string().nullable(),
      url: z.string(),
      html_url: z.string().nullable(),
      details_url: z.string().nullable(),
      status: z.enum(['queued', 'in_progress', 'completed']),
      conclusion: z
        .enum([
          'action_required',
          'cancelled',
          'failure',
          'neutral',
          'success',
          'skipped',
          'stale',
          'timed_out',
        ])
        .nullable(),
      started_at: z.string().nullable(),
      completed_at: z.string().nullable(),
      name: z.string(),
      check_suite: z
        .object({
          id: z.number(),
        })
        .passthrough()
        .optional(),
      app: z
        .object({
          id: z.number(),
          slug: z.string(),
          name: z.string(),
        })
        .passthrough()
        .optional(),
      pull_requests: z.array(z.unknown()).optional(),
    })
    .passthrough(),
});

export type CheckRunResponse = z.infer<typeof CheckRunResponseSchema>;

export const CreateCheckRunResponseSchema = CheckRunResponseSchema;
export type CreateCheckRunResponse = CheckRunResponse;

export const UpdateCheckRunResponseSchema = CheckRunResponseSchema;
export type UpdateCheckRunResponse = CheckRunResponse;

export const GetCheckRunResponseSchema = CheckRunResponseSchema;
export type GetCheckRunResponse = CheckRunResponse;
