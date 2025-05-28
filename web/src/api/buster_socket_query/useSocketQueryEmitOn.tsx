import type { BusterSocketResponseRoute, BusterSocketRequest } from '@/api/buster_socket';
import {
  useIsMutating,
  useQueryClient,
  useMutation,
  useMutationState,
  type QueryKey,
  type UseQueryOptions
} from '@tanstack/react-query';
import type { InferBusterSocketResponseData } from './types';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useEffect, useMemo, useRef } from 'react';
import { useSocketQueryOn } from './useSocketQueryOn';
import { timeout } from '@/lib';
import { useMemoizedFn } from '@/hooks';

export const useSocketQueryEmitOn = <
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TQueryKey extends QueryKey = QueryKey
>({
  emitEvent,
  responseEvent,
  options,
  callback,
  enabledTrigger: enabledTriggerProp
}: {
  emitEvent: BusterSocketRequest;
  responseEvent: TRoute;
  options: UseQueryOptions<TData, TError, TData, TQueryKey>;
  callback?:
    | ((currentData: TData | null, newData: InferBusterSocketResponseData<TRoute>) => TData)
    | null;
  enabledTrigger?: boolean | string;
}) => {
  const busterSocket = useBusterWebSocket();

  const enabledTrigger = enabledTriggerProp ?? true;

  const queryFn = useMemoizedFn(async () => {
    return await busterSocket.emitAndOnce({
      emitEvent,
      responseEvent: {
        route: responseEvent as '/chats/get:getChat',
        callback: (data: unknown) => data
      }
    });
  });

  const emitOptions: UseQueryOptions<TData, TError, TData, TQueryKey> = useMemo(() => {
    return {
      ...options,
      queryFn,
      enabled: !!enabledTrigger
    } as UseQueryOptions<TData, TError, TData, TQueryKey>;
  }, [options, queryFn, enabledTrigger]);

  return useSocketQueryOn({
    responseEvent,
    options: emitOptions,
    callback,
    isEmitOn: true
  });
};
