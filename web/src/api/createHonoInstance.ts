import { hc } from 'hono/client';
import { type AppType } from 'server/index';
import { BASE_URL_V2 } from './buster_rest/config';

export const createHonoInstance = (baseURL: string) => {
  const apiInstance = hc<AppType>(baseURL);

  return apiInstance;
};

const mainApi = createHonoInstance(BASE_URL_V2);
