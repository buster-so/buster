import { z } from 'zod';

// GitHub Action Documentation Request Schemas
export const GithubActionDocumentationPostSchema = z.object({
  // Could be multiple different events
  eventContext: z.record(z.string(), z.any()).describe('Event context from GitHub Action'),
});

export type GithubActionDocumentationPostRequest = z.infer<
  typeof GithubActionDocumentationPostSchema
>;

export const GithubActionDocumentationGetParamsSchema = z.object({
  id: z.string().describe('Message ID to retrieve documentation status'),
});

export const GithubActionDocumentationGetQuerySchema = z.object({
  commandId: z.string().optional().describe('Command ID to retrieve documentation status'),
  sessionId: z.string().optional().describe('Session ID to retrieve documentation status'),
  sandboxId: z.string().optional().describe('Sandbox ID to retrieve documentation status'),
});

export type GithubActionDocumentationGetParams = z.infer<
  typeof GithubActionDocumentationGetParamsSchema
>;

export type GithubActionDocumentationGetQuery = z.infer<
  typeof GithubActionDocumentationGetQuerySchema
>;

// GitHub Check Run Request Schemas
export const CheckRunCreateSchema = z.object({
  owner: z.string().describe('Repository owner (username or org name)'),
  repo: z.string().describe('Repository name'),
  name: z.string().describe('Name of the check run'),
  status: z
    .enum(['queued', 'in_progress', 'completed'])
    .optional()
    .describe('Status of the check run'),
  head_sha: z.string().describe('SHA of the commit to create the check run for'),
  external_id: z.string().optional().describe('External ID for the check run'),
  started_at: z
    .string()
    .datetime()
    .optional()
    .describe('ISO 8601 timestamp when the check run began'),
});

export type CheckRunCreateRequest = z.infer<typeof CheckRunCreateSchema>;

export const CheckRunUpdateSchema = z.object({
  owner: z.string().describe('Repository owner (username or org name)'),
  repo: z.string().describe('Repository name'),
  check_run_id: z.number().int().describe('The ID of the check run to update'),
  name: z.string().optional().describe('Name of the check run'),
  details_url: z.string().url().optional().describe('URL to view more details'),
  external_id: z.string().optional().describe('External ID for the check run'),
  started_at: z
    .string()
    .datetime()
    .optional()
    .describe('ISO 8601 timestamp when the check run began'),
  status: z
    .enum(['queued', 'in_progress', 'completed'])
    .optional()
    .describe('Status of the check run'),
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
    .optional()
    .describe('Conclusion of the check run (required if status is completed)'),
  completed_at: z
    .string()
    .datetime()
    .optional()
    .describe('ISO 8601 timestamp when the check run completed'),
  output: z
    .object({
      title: z.string().describe('Title of the check run output'),
      summary: z.string().describe('Summary of the check run output'),
      text: z.string().optional().describe('Details of the check run output'),
      annotations: z
        .array(
          z.object({
            path: z.string(),
            start_line: z.number().int(),
            end_line: z.number().int(),
            annotation_level: z.enum(['notice', 'warning', 'failure']),
            message: z.string(),
            title: z.string().optional(),
            raw_details: z.string().optional(),
          })
        )
        .optional(),
      images: z
        .array(
          z.object({
            alt: z.string(),
            image_url: z.string().url(),
            caption: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional()
    .describe('Output details for the check run'),
  actions: z
    .array(
      z.object({
        label: z.string(),
        description: z.string(),
        identifier: z.string(),
      })
    )
    .optional()
    .describe('Actions the user can perform'),
});

export type CheckRunUpdateRequest = z.infer<typeof CheckRunUpdateSchema>;

export const CheckRunGetSchema = z.object({
  owner: z.string().describe('Repository owner (username or org name)'),
  repo: z.string().describe('Repository name'),
  check_run_id: z.coerce.number().int().describe('The ID of the check run to retrieve'),
});

export type CheckRunGetRequest = z.infer<typeof CheckRunGetSchema>;

export const GithubInstallationCallbackSchema = z
  .object({
    state: z.string().optional(),
    installation_id: z.string().optional(),
    // Should be 'install', 'update', or 'request' but there are no docs on query params and it's better to not throw erros for validation on this.
    setup_action: z.string().optional(),
    error: z.string().optional(), // GitHub sends this when user cancels
    error_description: z.string().optional(),
  })
  .passthrough();

export type GithubInstallationCallbackRequest = z.infer<typeof GithubInstallationCallbackSchema>;
