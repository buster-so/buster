'use client';

import {
  type QueryFunction,
  type QueryKey,
  type UseQueryOptions,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from '@/hooks';
import type { InferBusterSocketResponseData } from './types';

export function useSocketQueryEmitAndOnce<
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TQueryKey extends QueryKey = QueryKey
>({
  emitEvent,
  responseEvent,
  options,
  callback
}: {
  emitEvent: BusterSocketRequest;
  responseEvent: TRoute;
  options: UseQueryOptions<TData, TError, TData, TQueryKey>;
  callback?: (currentData: TData | null, newData: InferBusterSocketResponseData<TRoute>) => TData;
}) {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  const queryFn: QueryFunction<TData> = useMemoizedFn(async ({ queryKey }): Promise<TData> => {
    const result = await busterSocket.emitAndOnce({
      emitEvent,
      responseEvent: {
        route: responseEvent,
        callback: (d: unknown) => {
          const socketData = d as InferBusterSocketResponseData<TRoute>;
          if (callback) {
            const currentData = queryClient.getQueryData<TData>(queryKey) ?? null;
            return callback(currentData, socketData);
          }
          return socketData as TData;
        }
      } as BusterSocketResponse
    });

    return result as TData;
  });

  return useQuery({
    queryFn,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...options
  });
}
