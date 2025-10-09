import { z } from 'zod';
import { getCredentials } from './credentials';

const ProxyConfigSchema = z.object({
  baseURL: z.string().url().describe('Base URL for the AI proxy endpoint'),
  apiKey: z.string().min(1).describe('API key for authentication'),
});

export type ProxyConfig = z.infer<typeof ProxyConfigSchema>;

/**
 * Gets the AI proxy configuration for the CLI
 *
 * Priority order:
 * 1. BUSTER_AI_PROXY_URL environment variable
 * 2. Saved credentials apiUrl from ~/.buster/credentials.json
 * 3. Default to localhost:3002 for local development
 *
 * API key comes from credentials (required)
 */
export async function getProxyConfig(): Promise<ProxyConfig> {
  const creds = await getCredentials();

  if (!creds?.apiKey) {
    throw new Error(
      'API key not found. Please set BUSTER_API_KEY environment variable or run "buster auth" to save credentials.'
    );
  }

  // Check for AI proxy-specific URL (highest priority)
  const proxyUrl = process.env.BUSTER_AI_PROXY_URL;

  if (proxyUrl) {
    return ProxyConfigSchema.parse({
      baseURL: proxyUrl,
      apiKey: creds.apiKey,
    });
  }

  // Fall back to regular API URL from credentials
  if (creds.apiUrl) {
    return ProxyConfigSchema.parse({
      baseURL: creds.apiUrl,
      apiKey: creds.apiKey,
    });
  }

  // Default to localhost for development
  return ProxyConfigSchema.parse({
    baseURL: 'http://localhost:3002',
    apiKey: creds.apiKey,
  });
}
