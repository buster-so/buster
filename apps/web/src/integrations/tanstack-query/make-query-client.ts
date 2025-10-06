import { QueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/api/errors';
import {
  ERROR_RETRY_DELAY,
  GC_TIME,
  PREFETCH_STALE_TIME,
  USER_CANCELLED_ERROR,
} from './query-client-config';

type OpenErrorNotification = (error: Error | { message: string } | ApiError) => void;

export function makeQueryClient(params?: {
  openErrorNotification?: OpenErrorNotification;
  enabled?: boolean;
}) {
  const baseEnabled = params?.enabled !== false;
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retryDelay: ERROR_RETRY_DELAY,
        staleTime: PREFETCH_STALE_TIME,
        gcTime: GC_TIME,
        enabled: () => {
          return (params?.enabled ?? true) && baseEnabled;
        },
        queryFn: () => Promise.resolve(),
        retry: (_failureCount, error) => {
          if (params?.openErrorNotification) {
            params.openErrorNotification(error);
          }
          return false;
        },
      },
      mutations: {
        retry: (_failureCount, error) => {
          if (params?.openErrorNotification && error !== USER_CANCELLED_ERROR) {
            params.openErrorNotification(error);
          }
          return false;
        },
      },
      dehydrate: {
        shouldDehydrateQuery: () => true,
        shouldRedactErrors: () => false,
      },
    },
  });
}
