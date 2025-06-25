'use client';

// import { hc } from 'hono/client';

/*
 * Decided not to use Hono RPC due to caching and build issues.
 * When the server was updated, it would cause the UI to rebuild unexpectedly.
 * Using a shared types package approach is simpler and avoids these caching complications.
 * The commented code below shows what the Hono RPC implementation would have looked like.
 */

export const createHonoInstance = (
  baseURL: string,
  getAccessToken: () => Promise<{
    access_token: string;
  }>
) => {
  // const honoInstance = hc<AppType>(baseURL, {
  //   headers: async () => {
  //     const { access_token } = await getAccessToken();
  //     return {
  //       Authorization: `Bearer ${access_token}`
  //     };
  //   }
  // });
  // return honoInstance;
};
