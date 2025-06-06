'use client';

import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useMemo } from 'react';
import type { BusterSocketResponse, BusterSocketResponseRoute } from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn, useMount, useUnmount } from '@/hooks';
import type { InferBusterSocketResponseData } from './types';

type UseSocketQueryOnResult<TData, TError> = UseQueryResult<TData, TError>;

export const useSocketQueryOn = <
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TQueryKey extends QueryKey = QueryKey
>({
  responseEvent,
  options,
  callback,
  isEmitOn
}: {
  responseEvent: TRoute;
  options?: UseQueryOptions<TData, TError, TData, TQueryKey> | null;
  callback?:
    | ((
        currentData: TData | null,
        newData: InferBusterSocketResponseData<TRoute>
      ) => TData | undefined)
    | null;
  isEmitOn?: boolean;
}): UseSocketQueryOnResult<TData, TError> => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();
  const queryKey = options?.queryKey ?? '';

  const hasBufferCallback = !!callback;

  const socketCallback = useMemoizedFn((d: unknown) => {
    const socketData = d as InferBusterSocketResponseData<TRoute>;

    const transformer = callback || defaultCallback<TData, TRoute>;
    const currentData = queryKey ? (queryClient.getQueryData<TData>(queryKey) ?? null) : null;
    const transformedData = transformer(currentData, socketData);

    if (hasBufferCallback && transformedData) {
      if (queryKey) queryClient.setQueryData<TData>(queryKey, transformedData);
    } else if (transformedData) {
      if (queryKey) queryClient.setQueryData<TData>(queryKey, transformedData);
    }
  });

  const socketConfig = useMemo(() => {
    return {
      route: responseEvent,
      callback: socketCallback
    } as BusterSocketResponse;
  }, [responseEvent, socketCallback]);

  useMount(() => {
    const hasCallbacks = busterSocket.getCurrentListeners(responseEvent).length > 0;
    if (!hasCallbacks || isEmitOn) busterSocket.on(socketConfig);
  });

  useUnmount(() => {
    busterSocket.off(socketConfig);
  });

  return useQuery({
    ...options,
    queryKey: queryKey as TQueryKey,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? !!options?.queryFn // must be disabled, because it will be enabled by the socket
  });
};

const defaultCallback = <TData, TRoute extends BusterSocketResponseRoute>(
  currentData: TData | null,
  d: InferBusterSocketResponseData<TRoute>
) => d as TData;
