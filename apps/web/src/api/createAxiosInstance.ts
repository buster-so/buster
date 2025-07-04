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

  apiInstance.interceptors.response.use(
    (resp) => {
      return resp;
    },
    (error: AxiosError) => {
      const errorCode = error.response?.status;
      //402 is the payment required error code
      if (errorCode === 402) {
        window.location.href = createBusterRoute({
          route: BusterRoutes.INFO_GETTING_STARTED
        });
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
  if (isServer) {
    token = await getSupabaseTokenFromCookies();
  } else {
    token = (await options?.checkTokenValidity()?.then((res) => res?.access_token || '')) || '';
  }

  (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;

  return config;
};
