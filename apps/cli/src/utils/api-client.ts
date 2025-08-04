import { z } from 'zod';
import { CLIError, ApiError } from './errors.js';

export class ApiClient {
  constructor(
    private baseUrl: string,
    private apiKey?: string
  ) {}

  async request<T>({
    method,
    path,
    body,
    responseSchema,
  }: {
    method: string;
    path: string;
    body?: unknown;
    responseSchema: z.ZodSchema<T>;
  }): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(response.status, errorText || response.statusText);
      }

      const data = await response.json();
      return responseSchema.parse(data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new CLIError('Invalid API response format', 'VALIDATION_ERROR');
      }
      throw new CLIError('Network error', 'NETWORK_ERROR');
    }
  }

  // Convenience methods
  async validateAuth(): Promise<boolean> {
    try {
      await this.request({
        method: 'GET',
        path: '/api/v2/auth/validate',
        responseSchema: z.object({ valid: z.boolean() }),
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let apiClient: ApiClient;

export function initApiClient(baseUrl: string, apiKey?: string): void {
  apiClient = new ApiClient(baseUrl, apiKey);
}

export function getApiClient(): ApiClient {
  if (!apiClient) {
    throw new CLIError('API client not initialized', 'NOT_INITIALIZED');
  }
  return apiClient;
}