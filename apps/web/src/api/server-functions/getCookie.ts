import { createServerFn } from '@tanstack/react-start';
import Cookies from 'js-cookie';
import { z } from 'zod';
import { isServer } from '@/lib/window';
import { getServerCookie } from './getServerCookie';

const getCookieServerFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data }) => {
    const cookieName = data;

    const cookieValue = isServer
      ? await getServerCookie({ data: { cookieName } })
      : Cookies.get(cookieName);

    return cookieValue;
  });

export const getCookie = async ({ data }: { data: string }): Promise<string | undefined> => {
  if (isServer) {
    return getCookieServerFn({ data });
  }
  return Cookies.get(data);
};
