'use server';

import { BASE_URL } from './buster_rest/instances';
import type { RequestInit } from 'next/dist/server/web/spec-extension/request';
import { createServerSupabaseClient } from '../context/Supabase/server';

export interface FetchConfig extends RequestInit {
  baseURL?: string;
  params?: Record<string, string | number | boolean>;
}

export const serverFetch = async <T>(url: string, config: FetchConfig = {}): Promise<T> => {
  const supabase = await createServerSupabaseClient();
  const sessionData = await supabase.auth.getSession();
  const accessToken = sessionData.data?.session?.access_token;

  const { baseURL = BASE_URL, params, headers = {}, method = 'GET', ...restConfig } = config;

  // Construct URL with query parameters
  const queryParams = params
    ? `?${new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])))}`
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
