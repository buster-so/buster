import { z } from 'zod';

export enum AuthErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  MISSING_API_KEY = 'MISSING_API_KEY',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const authErrorSchema = z.object({
  code: z.nativeEnum(AuthErrorCode),
  message: z.string(),
  details: z.any().optional(),
});

export type AuthError = z.infer<typeof authErrorSchema>;
