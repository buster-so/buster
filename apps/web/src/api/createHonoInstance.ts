'use client';

import { hc } from 'hono/client';
import type { AppType } from '@buster-app/server';

export const createHonoInstance = (
  baseURL: string,
  getAccessToken: () => Promise<{
    access_token: string;
  }>
) => {
  const honoInstance = hc<AppType>(baseURL, {
    headers: async () => {
      const { access_token } = await getAccessToken();

      return {
        Authorization: `Bearer ${access_token}`
      };
    }
  });

  return honoInstance;
};
