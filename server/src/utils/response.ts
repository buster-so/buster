import type { Context } from 'hono';

export const successResponse = (c: Context, data: any, message = 'Success') => {
  return c.json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (c: Context, message: string, status: 400 | 500 | 422 = 400) => {
  return c.json(
    {
      success: false,
      message,
      error: true
    },
    status
  );
};

export const notFoundResponse = (c: Context, resource = 'Resource') => {
  return c.json(
    {
      success: false,
      message: `${resource} not found`,
      error: true
    },
    404
  );
};

export const unauthorizedResponse = (c: Context, message = 'Unauthorized') => {
  return c.json(
    {
      success: false,
      message,
      error: true
    },
    401
  );
};
