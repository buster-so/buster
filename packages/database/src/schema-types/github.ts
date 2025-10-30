import { z } from 'zod';

// GitHub integration status enum
export const GithubIntegrationStatusSchema = z.enum(['pending', 'active', 'suspended', 'revoked']);
export type GithubIntegrationStatus = z.infer<typeof GithubIntegrationStatusSchema>;

export const GithubRepositorySchema = z.object({
  full_name: z.string(),
  id: z.number(),
  name: z.string(),
  node_id: z.string(),
  private: z.boolean(),
});

export type GithubRepository = z.infer<typeof GithubRepositorySchema>;
