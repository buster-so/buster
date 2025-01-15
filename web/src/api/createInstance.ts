import { BusterRoutes } from '@/routes/busterRoutes/busterRoutes';
import axios, { AxiosError } from 'axios';
import { rustErrorHandler } from './buster-rest/errors';
import { AxiosRequestHeaders } from 'axios';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

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
      // console.error(error);
      //Redirect to login if 401 unauthorized error
      if (error.status === 401 && typeof window !== 'undefined') {
        window.location.href = BusterRoutes.AUTH_LOGIN;
      }
      return Promise.reject(rustErrorHandler(error));
    }
  );

  apiInstance.interceptors.request.use(defaultRequestHandler);
  return apiInstance;
};

export const defaultRequestHandler = async (
  config: any,
  options?: {
    accessToken: string;
  }
) => {
  let token = '';
  const isServer = typeof window === 'undefined';
  if (isServer) {
    const { cookies } = require('next/headers');
    const cookiesManager = cookies() as ReadonlyRequestCookies;
    const tokenCookie =
      cookiesManager.get('sb-127-auth-token') || cookiesManager.get('next-sb-access-token');
    token = tokenCookie?.value || '';
  } else {
    token = options?.accessToken || '';
  }

  if (token) {
    (config.headers as AxiosRequestHeaders)['Authorization'] = 'Bearer ' + token;
  }

  return config;
};
