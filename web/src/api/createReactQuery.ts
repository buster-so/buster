'use client';

import { useSupabaseContext } from '@/context/Supabase/SupabaseContextProvider';
import {
  useQueryClient,
  useMutation,
  useQuery,
  UseQueryOptions,
  keepPreviousData,
  useInfiniteQuery
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { RustApiError } from './buster_rest/errors';
import { useMemoizedFn } from 'ahooks';

export interface BaseCreateQueryProps {
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  enabled?: boolean;
  staleTime?: number;
  accessToken?: string;
}
interface CreateQueryProps<T> extends UseQueryOptions<T> {
  queryKey: (string | number | object)[];
  isUseSession?: boolean;
  useErrorNotification?: boolean;
}

export const PREFETCH_STALE_TIME = 1000 * 10;

export const useCreateReactQuery = <T>({
  queryKey,
  queryFn,
  isUseSession = true,
  enabled = true,
  initialData,
  refetchOnWindowFocus = false,
  refetchOnMount = true,
  useErrorNotification = true,
  staleTime,
  ...rest
}: CreateQueryProps<T> & BaseCreateQueryProps) => {
  const { openErrorNotification } = useBusterNotifications();
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const baseEnabled = isUseSession ? !!accessToken : true;

  const q = useQuery({
    queryKey: queryKey,
    queryFn,
    enabled: baseEnabled && !!enabled,
    initialData,
    retry: 1,
    refetchOnWindowFocus,
    refetchOnMount,
    staleTime,
    ...rest
  });

  useEffect(() => {
    if (q.error && useErrorNotification) {
      const errorMessage = q.error as RustApiError;
      openErrorNotification({
        message: errorMessage.message
      });
    }
  }, [q.error, useErrorNotification]);

  return q;
};

export const useResetReactQuery = () => {
  const queryClient = useQueryClient();

  const run = useMemoizedFn(() => {
    queryClient.clear();
  });

  return { run };
};

interface CreateMutationProps<T, V> {
  mutationFn: (data: T) => Promise<V>;
  onSuccess?: Parameters<typeof useMutation>['0']['onSuccess'];
  onError?: Parameters<typeof useMutation>['0']['onError'];
  useErrorNotification?: boolean;
}

export const useCreateReactMutation = <T, V>({
  mutationFn,
  onSuccess,
  onError,
  useErrorNotification = true
}: CreateMutationProps<T, V>) => {
  const { openErrorNotification } = useBusterNotifications();
  const res = useMutation({ mutationFn, onSuccess, onError });

  useEffect(() => {
    if (res.error && useErrorNotification) {
      const errorMessage = res.error as RustApiError;
      openErrorNotification({
        message: errorMessage.message
      });
    }
  }, [res.error, useErrorNotification]);

  return res;
};

interface PaginatedQueryProps<T> extends CreateQueryProps<T> {
  page?: number;
  pageSize?: number;
  initialData?: T;
}

export const useCreateReactQueryPaginated = <T>({
  queryKey,
  queryFn,
  isUseSession = true,
  enabled = true,
  initialData,
  refetchOnWindowFocus = false,
  refetchOnMount = true,
  page = 0,
  pageSize = 25,
  ...rest
}: PaginatedQueryProps<T> & BaseCreateQueryProps) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const baseEnabled = isUseSession ? !!accessToken : true;

  return useQuery({
    queryKey: [...queryKey, { page, pageSize }],
    queryFn,
    enabled: baseEnabled && !!enabled,
    initialData,
    retry: 1,
    refetchOnWindowFocus,
    refetchOnMount,
    placeholderData: keepPreviousData,
    ...rest
  });
};

type InfiniteQueryReturnType<T> = Omit<ReturnType<typeof useInfiniteQuery>, 'data'> & {
  data: T | undefined;
};

export const useCreateReactInfiniteQuery = <T>({
  queryKey,
  queryFn,
  enabled = true,
  initialPageParam = 0,
  getNextPageParam,
  ...rest
}: Parameters<typeof useInfiniteQuery>[0] & BaseCreateQueryProps) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const baseEnabled = !!accessToken;

  return useInfiniteQuery({
    ...rest,
    queryKey: [...queryKey],
    getNextPageParam,
    initialPageParam,
    enabled: baseEnabled && !!enabled
  }) as InfiniteQueryReturnType<T>;
};
