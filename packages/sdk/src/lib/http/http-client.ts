import type { SDKConfig } from '../config';
import { NetworkError, SDKError } from '../errors';

// Build URL with query params and /api/v2 prefix for Buster API routes
export function buildUrl(baseUrl: string, path: string, params?: Record<string, string>): string {
  // If the path doesn't start with /api, assume it's a Buster API route and add /api/v2 prefix
  const finalPath = path.startsWith('/api')
    ? path
    : `/api/v2${path.startsWith('/') ? path : `/${path}`}`;
  const url = new URL(finalPath, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

// Build request headers
function buildHeaders(config: SDKConfig): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
    ...config.headers,
  };
}

// Make HTTP request with retries
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryCount = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | undefined;

  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await fetch(url, options);

      // Don't retry on client errors (4xx) except 429
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Return successful responses
      if (response.ok) {
        return response;
      }

      // Save error for potential retry
      lastError = new SDKError(`HTTP ${response.status}`, response.status);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Wait before retry (exponential backoff)
    if (i < retryCount - 1) {
      await new Promise((resolve) => setTimeout(resolve, retryDelay * 2 ** i));
    }
  }

  throw lastError || new NetworkError();
}

// Main request function
export async function request<T = unknown>(
  config: SDKConfig,
  method: string,
  path: string,
  options?: {
    body?: unknown;
    params?: Record<string, string>;
  }
): Promise<T> {
  const url = buildUrl(config.apiUrl, path, options?.params);

  const requestOptions: RequestInit = {
    method,
    headers: buildHeaders(config),
    signal: AbortSignal.timeout(config.timeout),
  };

  if (options?.body !== undefined && method !== 'GET') {
    requestOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetchWithRetry(
      url,
      requestOptions,
      config.retryAttempts,
      config.retryDelay
    );

    if (!response.ok) {
      throw new SDKError(`Request failed: ${response.statusText}`, response.status);
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof SDKError) {
      throw error;
    }
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }
      throw new NetworkError(error.message);
    }
    throw new NetworkError();
  }
}

// Convenience methods
export const get = <T>(config: SDKConfig, path: string, params?: Record<string, string>) =>
  request<T>(config, 'GET', path, params ? { params } : undefined);

export const post = <T>(config: SDKConfig, path: string, body?: unknown) =>
  request<T>(config, 'POST', path, { body });

export const put = <T>(config: SDKConfig, path: string, body?: unknown) =>
  request<T>(config, 'PUT', path, { body });

export const del = <T>(config: SDKConfig, path: string) => request<T>(config, 'DELETE', path);
