import { HTTPException } from 'hono/http-exception';
import type { ErrorResponse } from '../types/errors.types';

export const errorResponse = (
  message: string | Error | unknown,
  status: 500 | 400 | 401 | 403 | 404 | 409 | 500 = 400
) => {
  const errorMessage =
    typeof message === 'string'
      ? message
      : message instanceof Error
        ? message.message
        : 'Internal server error';
  return new HTTPException(status, {
    message: errorMessage,
  } satisfies ErrorResponse);
};

export const notFoundResponse = (resource = 'Resource') => {
  throw new HTTPException(404, {
    message: `${resource} not found`,
  } satisfies ErrorResponse);
};

export const unauthorizedResponse = (message = 'Unauthorized') => {
  throw new HTTPException(401, {
    message,
  } satisfies ErrorResponse);
};
