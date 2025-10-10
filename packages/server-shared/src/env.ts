import { z } from 'zod';

const EnvSchema = z.object({
  VITE_PUBLIC_URL: z.string(),
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
