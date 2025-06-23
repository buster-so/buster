import type { RustApiError } from './buster_rest/errors';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: RustApiError;
  }
}
