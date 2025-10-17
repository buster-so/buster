import { createServerFn } from '@tanstack/react-start';
import Cookies from 'js-cookie';
import { z } from 'zod';
import { isServer } from '@/lib/window';
import { getServerCookie } from './getServerCookie';

export const getCookie = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ cookieName: z.string() }))
  .handler(async ({ data }) => {
    const { cookieName } = data;

    const cookieValue = isServer
      ? await getServerCookie({ data: { cookieName } })
      : Cookies.get(cookieName);

    return cookieValue;
  });
