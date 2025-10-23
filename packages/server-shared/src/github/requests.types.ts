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
