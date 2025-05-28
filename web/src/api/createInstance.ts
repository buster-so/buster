import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { rustErrorHandler } from './buster_rest/errors';
import type { AxiosRequestHeaders } from 'axios';
import { isServer } from '@tanstack/react-query';
import { getSupabaseTokenFromCookies } from './createServerInstance';
import type { SupabaseContextReturnType } from '@/context/Supabase/SupabaseContextProvider';
import { BusterRoutes, createBusterRoute } from '@/routes';

const AXIOS_TIMEOUT = 120000; // 2 minutes

export const createInstance = (baseURL: string) => {
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

  apiInstance.interceptors.request.use(defaultRequestHandler);
  return apiInstance;
};

export const defaultRequestHandler = async (
  config: InternalAxiosRequestConfig<any>,
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

  (config.headers as AxiosRequestHeaders)['Authorization'] = 'Bearer ' + token;

  return config;
};
