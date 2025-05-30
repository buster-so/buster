import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { BusterSocketRequest, BusterSocketResponseRoute } from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from '@/hooks';
import type { InferBusterSocketResponseData } from './types';
import { useSocketQueryOn } from './useSocketQueryOn';

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
