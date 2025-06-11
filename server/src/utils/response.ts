import type { Context } from 'hono';
import type { ErrorResponse } from '../types/errors.types';

export const errorResponse = (
  c: Context,
  message: string | Error | unknown,
  status: 500 | 400 | 401 | 403 | 404 | 409 | 500 = 400
) => {
  const errorMessage =
    typeof message === 'string'
      ? message
      : message instanceof Error
        ? message.message
        : 'Internal server error';
  return c.json({ message: errorMessage } satisfies ErrorResponse, status);
};

export const notFoundResponse = (c: Context, resource = 'Resource') => {
  return c.json({ message: `${resource} not found` } satisfies ErrorResponse, 404);
};

export const unauthorizedResponse = (c: Context, message = 'Unauthorized') => {
  return c.json({ message } satisfies ErrorResponse, 401);
};
