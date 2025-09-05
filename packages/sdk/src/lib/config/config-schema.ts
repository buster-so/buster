import { z } from 'zod';

// SDK Configuration Schema
export const SDKConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  apiUrl: z.string().url().default('https://api2.buster.so'), // Base URL without /api/v2
  timeout: z.number().min(1000).max(60000).default(30000),
  retryAttempts: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(100).max(5000).default(1000),
  headers: z.record(z.string()).optional(),
});

export type SDKConfig = z.infer<typeof SDKConfigSchema>;
