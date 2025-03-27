import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { rustErrorHandler } from './buster_rest/errors';
import { AxiosRequestHeaders } from 'axios';
import { isServer } from '@tanstack/react-query';
import { getSupabaseTokenFromCookies } from './createServerInstance';
import { SupabaseContextReturnType } from '@/context/Supabase/SupabaseContextProvider';

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
