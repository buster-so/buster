import { z } from 'zod';

// GitHub App Installation Webhook Payload
// Received when a GitHub App is installed, deleted, suspended, or unsuspended
export const InstallationCallbackSchema = z.object({
  action: z.enum(['created', 'deleted', 'suspend', 'unsuspend', 'new_permissions_accepted']),
  installation: z.object({
    id: z.number(), // GitHub installation ID
    account: z.object({
      login: z.string(), // GitHub org/user name
      id: z.number(), // GitHub org/user ID
      type: z.enum(['User', 'Organization']).optional(),
      avatar_url: z.string().optional(),
      html_url: z.string().optional(),
    }),
    repository_selection: z.enum(['all', 'selected']).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    permissions: z.record(z.string()).optional(),
    events: z.array(z.string()).optional(),
  }),
  // Optional fields that may be present in webhook
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
  sender: z
    .object({
      login: z.string(),
      id: z.number(),
      type: z.string(),
    })
    .optional(),
});

export type InstallationCallbackRequest = z.infer<typeof InstallationCallbackSchema>;

// Request to get an installation access token
export const GetInstallationTokenRequestSchema = z.object({
  installationId: z.string(), // We store as string in our DB
});

export type GetInstallationTokenRequest = z.infer<typeof GetInstallationTokenRequestSchema>;

// Request to refresh an installation's token
export const RefreshInstallationTokenRequestSchema = z.object({
  organizationId: z.string().uuid(),
});

export type RefreshInstallationTokenRequest = z.infer<typeof RefreshInstallationTokenRequestSchema>;

// GitHub Action Documentation Request Schemas
export const GithubActionDocumentationPostSchema = z.object({
  // Could be multiple different events
  eventContext: z.record(z.string(), z.any()).describe('Event context from GitHub Action'),
});

export type GithubActionDocumentationPostRequest = z.infer<
  typeof GithubActionDocumentationPostSchema
>;

export const GithubActionDocumentationGetSchema = z.object({
  id: z.string().describe('Message ID to retrieve documentation status'),
});

export type GithubActionDocumentationGetRequest = z.infer<
  typeof GithubActionDocumentationGetSchema
>;
