import { isServer } from '@tanstack/react-query';
import type { AxiosRequestHeaders } from 'axios';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { SupabaseContextReturnType } from '@/context/Supabase/SupabaseContextProvider';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { rustErrorHandler } from './buster_rest/errors';
import { getSupabaseTokenFromCookies } from './createServerInstance';

const AXIOS_TIMEOUT = 120000; // 2 minutes

export const createAxiosInstance = (baseURL: string) => {
  const apiInstance = axios.create({
    baseURL,
    timeout: AXIOS_TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Response interceptor with retry logic for auth errors
  apiInstance.interceptors.response.use(
    (resp) => {
      return resp;
    },
    async (error: AxiosError) => {
      const errorCode = error.response?.status;

      //402 is the payment required error code
      if (errorCode === 402) {
        window.location.href = createBusterRoute({
          route: BusterRoutes.INFO_GETTING_STARTED
        });
        return Promise.reject(rustErrorHandler(error));
      }

      // Handle 401 Unauthorized - token might be expired
      if (errorCode === 401 && !isServer) {
        // Only retry once to avoid infinite loops
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Force token refresh and retry the request
            console.info('401 error detected, attempting to refresh token and retry request');

            // The request interceptor will handle getting the new token
            return apiInstance(originalRequest);
          } catch (refreshError) {
            console.error('Failed to refresh token and retry request:', refreshError);
            // If refresh fails, redirect to login or show error
            window.location.href = createBusterRoute({
              route: BusterRoutes.AUTH_LOGIN
            });
          }
        }
      }

      return Promise.reject(rustErrorHandler(error));
    }
  );

  apiInstance.interceptors.request.use(defaultAxiosRequestHandler);
  return apiInstance;
};

export const defaultAxiosRequestHandler = async (
  config: InternalAxiosRequestConfig<unknown>,
  options?: {
    checkTokenValidity: SupabaseContextReturnType['checkTokenValidity'];
  }
) => {
  let token = '';

  try {
    if (isServer) {
      token = await getSupabaseTokenFromCookies();
    } else {
      // Always check token validity before making requests
      const tokenResult = await options?.checkTokenValidity?.();
      token = tokenResult?.access_token || '';
    }

    if (!token && options?.checkTokenValidity) {
      throw new Error('User authentication error - no token found');
    }

    (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;

    return config;
  } catch (error) {
    console.error('Error getting auth token for request:', error);
    throw new Error('User authentication error - failed to get valid token');
  }
};
