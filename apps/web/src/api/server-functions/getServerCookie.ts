import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { z } from 'zod';

export const getServerCookie = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      cookieName: z.string(),
    })
  )
  .handler(async ({ data }) => {
    return getCookie(data.cookieName);
  });
