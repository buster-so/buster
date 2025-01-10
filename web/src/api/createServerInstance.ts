'use server';

import { createClient } from '@/context/Supabase/server'
import { BASE_URL } from './buster/instances';
import type { RequestInit } from 'next/dist/server/web/spec-extension/request';

export interface FetchConfig extends RequestInit {
  baseURL?: string;
  params?: Record<string, string>;
}

export const serverFetch = async <T>(url: string, config: FetchConfig = {}): Promise<T> => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const { baseURL = BASE_URL, params, headers = {}, method = 'GET', ...restConfig } = config;

  // Construct URL with query parameters
  const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';

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
