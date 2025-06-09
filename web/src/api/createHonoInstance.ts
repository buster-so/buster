import { hc } from 'hono/client';
import { type AppType } from 'server/index';

export const createHonoInstance = (baseURL: string) => {
  const apiInstance = hc<AppType>(baseURL);
  return apiInstance;
};
