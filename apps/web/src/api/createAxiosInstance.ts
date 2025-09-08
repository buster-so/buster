import { isServer } from '@tanstack/react-query';
import type { AxiosRequestHeaders } from 'axios';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Route as AuthRoute } from '@/routes/auth.login';
import { checkTokenValidity } from './auth_helpers/check-token-validity';
import { BASE_URL_V2 } from './config';
import { rustErrorHandler } from './errors';
import { getSupabaseSessionServerFn } from './server-functions/getSupabaseSession';

const AXIOS_TIMEOUT = 120000; // 2 minutes

export const createAxiosInstance = (baseURL = BASE_URL_V2) => {
  const apiInstance = axios.create({
    baseURL,
    timeout: AXIOS_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
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
        window.location.href = AuthRoute.to;
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
            window.location.href = AuthRoute.to;
          }
        }
      }

      return Promise.reject(rustErrorHandler(error));
    }
  );

  apiInstance.interceptors.request.use(defaultAxiosRequestHandler);
  return apiInstance;
};

export const defaultAxiosRequestHandler = async (config: InternalAxiosRequestConfig<unknown>) => {
  let token: string | undefined = '';

  try {
    if (isServer) {
      token = await getSupabaseSessionServerFn().then(
        ({ data: { session } }) => session.access_token
      );
    } else {
      // Always check token validity before making requests
      const tokenResult = await checkTokenValidity();
      token = tokenResult?.access_token || '';
    }

    if (!token) {
      throw new Error('User authentication error - no token found');
    }

    (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;

    return config;
  } catch (error) {
    console.error('Error getting auth token for request:', error);
    throw new Error('User authentication error - failed to get valid token');
  }
};
