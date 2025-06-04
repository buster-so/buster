import type { Context } from 'hono';
import type { ErrorResponse } from '../types/errors.types';

export const errorResponse = (c: Context, message: string, status: 400 | 500 | 422 = 400) => {
  return c.json({ message } satisfies ErrorResponse, status);
};

export const notFoundResponse = (c: Context, resource = 'Resource') => {
  return c.json({ message: `${resource} not found` } satisfies ErrorResponse, 404);
};

export const unauthorizedResponse = (c: Context, message = 'Unauthorized') => {
  return c.json({ message } satisfies ErrorResponse, 401);
};
