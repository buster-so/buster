import type { ApiError } from './errors';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
