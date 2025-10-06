import isString from 'lodash/isString';
import type { ZodError } from 'zod';

export const apiErrorHandler = (errors: unknown = {}): ApiError => {
  // Type guards and safe property access
  const isErrorObject = (obj: unknown): obj is Record<string, unknown> =>
    typeof obj === 'object' && obj !== null;

  const data =
    isErrorObject(errors) && isErrorObject(errors.response) ? errors.response.data : undefined;
  const status =
    isErrorObject(errors) && typeof errors.status === 'number' ? errors.status : undefined;

  if ((data as { error?: ZodError }).error?.issues?.length) {
    const _data = data as { error?: ZodError };
    const firstIssues = _data.error?.issues[0]?.message;
    if (firstIssues) {
      return { message: String(firstIssues), status };
    }
  }

  if (data && isString(data)) {
    return { message: String(data), status };
  }

  if (isErrorObject(data) && data.message) {
    return { message: String(data.message), status };
  }

  if (isErrorObject(data) && data.detail) {
    if (typeof data.detail === 'string') {
      return { message: String(data.detail), status };
    }

    if (
      Array.isArray(data.detail) &&
      data.detail[0] &&
      isErrorObject(data.detail[0]) &&
      data.detail[0].msg
    ) {
      return { message: String(data.detail[0].msg), status };
    }
    return { message: String(data.detail), status };
  }

  if (isErrorObject(errors) && errors.message) {
    return { message: String(errors.message), status };
  }

  if (typeof errors === 'string') {
    return { message: String(errors), status };
  }

  return {};
};

export interface ApiError {
  message?: string;
  status?: number;
}
