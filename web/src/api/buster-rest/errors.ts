import isString from 'lodash/isString';

export const rustErrorHandler = (errors: any = {}): RustApiError => {
  const data = errors?.response?.data;

  if (data && isString(data)) {
    return { message: String(data) };
  }

  if (data && data?.message) {
    return { message: String(data.message) };
  }

  if (data && data?.detail) {
    if (typeof data.detail === 'string') {
      return { message: String(data.detail) };
    }

    if (data.detail?.[0]) {
      return { message: String(data.detail[0].msg) };
    }
    return { message: String(data.detail) };
  }
  if (errors?.message) {
    return { message: String(errors.message) };
  }

  if (typeof errors === 'string') {
    return { message: String(errors) };
  }

  return {};
};

export interface RustApiError {
  message?: string;
}
