import { z } from 'zod';

// Command arguments schema
export const AuthArgsSchema = z.object({
  host: z.string().url().optional(),
  apiKey: z.string().optional(),
  environment: z.enum(['local', 'cloud']).default('cloud'),
});

export type AuthArgs = z.infer<typeof AuthArgsSchema>;

// Credentials schema
export const CredentialsSchema = z.object({
  apiKey: z.string(),
  apiUrl: z.string().url(),
  environment: z.enum(['local', 'cloud']),
});

export type Credentials = z.infer<typeof CredentialsSchema>;