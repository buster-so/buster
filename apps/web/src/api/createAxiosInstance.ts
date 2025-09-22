import { isServer } from '@tanstack/react-query';
import type { AxiosRequestHeaders } from 'axios';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';
import { Route as AuthRoute } from '@/routes/auth.login';
import { BASE_URL_V2 } from './config';
import { rustErrorHandler } from './errors';

const AXIOS_TIMEOUT = 180000; // 3 minutes

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
        console.info(
          '401 error detected, you are not authorized to access this resource. Wamp wamp 🎺 '
        );
      }

      return Promise.reject(rustErrorHandler(error));
    }
  );

  apiInstance.interceptors.request.use(defaultAxiosRequestHandler);
  return apiInstance;
};

export const defaultAxiosRequestHandler = async (config: InternalAxiosRequestConfig<unknown>) => {
  try {
    const session = await getSupabaseSession();
    const { accessToken: token } = session;

    if (!token) {
      console.warn('No token found');
      window.location.href = AuthRoute.to;
      return Promise.reject(new Error('No token found'));
    }

    (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;

    return config;
  } catch (error) {
    // Log the error but don't throw to prevent unhandled rejections
    console.error(
      'Error in axios request handler:',
      {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
        params: config.params,
        baseURL: config.baseURL,
        timeout: config.timeout,
      },
      error
    );

    // Return config without auth header - let the backend handle unauthorized requests
    return config;
  }
};
