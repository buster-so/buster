import { openErrorNotification } from '@/context/BusterNotifications';
import type { ApiError } from '../errors';

export const silenceAssetErrors = (_count: number, error: ApiError): boolean => {
  if (error.status === 418) {
    return false;
  }

  if (error.status === 410) {
    return false;
  }

  if (error.status === 403) {
    return false;
  }

  if (error.status === 412) {
    return false;
  }

  openErrorNotification(error);

  return false;
};
