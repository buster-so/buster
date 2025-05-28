'use server';

import { BASE_URL } from './buster_rest/config';
import type { RequestInit } from 'next/dist/server/web/spec-extension/request';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { RustApiError } from './buster_rest/errors';

export interface FetchConfig extends RequestInit {
  baseURL?: string;
  params?: Record<string, unknown>;
}

export const serverFetch = async <T>(url: string, config: FetchConfig = {}): Promise<T> => {
  const supabase = await createClient();
  const sessionData = await supabase.auth.getSession();
  const accessToken = sessionData.data?.session?.access_token;

  const { baseURL = BASE_URL, params, headers = {}, method = 'GET', ...restConfig } = config;

  // Construct URL with query parameters
  const queryParams = params
    ? `?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        )
      )}`
    : '';

  const fullUrl = `${baseURL}${url}${queryParams}`;

  // Merge headers with authorization
  const finalHeaders = {
    ...headers,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` })
  };

  try {
    const response = await fetch(fullUrl, {
      method,
      ...restConfig,
      headers: finalHeaders
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw {
        status: response.status,
        message: errorText || response.statusText
      } satisfies RustApiError;
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const getSupabaseTokenFromCookies = async () => {
  const cookiesManager = await cookies();
  const tokenCookie =
    cookiesManager.get('sb-127-auth-token') || cookiesManager.get('next-sb-access-token');
  return tokenCookie?.value || '';
};
