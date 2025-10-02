import {
  type BackoffOptions,
  type ChangeMessage,
  isChangeMessage,
  type MaybePromise,
  type Message,
  type Row,
} from '@electric-sql/client';
import { getShapeStream, useShape as useElectricShape } from '@electric-sql/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGetSupabaseAccessToken } from '@/context/Supabase';
import { ELECTRIC_BASE_URL } from './config';

export type ElectricShapeOptions<T extends Row<unknown> = Row<unknown>> = Omit<
  Parameters<typeof useElectricShape<T>>[0],
  'url'
>;

export const useShape = <T extends Row<unknown> = Row<unknown>>(
  params: ElectricShapeOptions<T>
): ReturnType<typeof useElectricShape<T>> => {
  const accessToken = useGetSupabaseAccessToken();

  const shapeStream: Parameters<typeof useElectricShape<T>>[0] = useMemo(() => {
    return createElectricShape(params, accessToken);
  }, [accessToken, params]);

  return useElectricShape<T>(shapeStream);
};

const backoffOptions: BackoffOptions = {
  initialDelay: 1000,
  maxDelay: 10000,
  multiplier: 2,
};

const createElectricShape = <T extends Row<unknown> = Row<unknown>>(
  { params, subscribe = true, ...config }: ElectricShapeOptions<T>,
  accessToken: string
): Parameters<typeof useElectricShape<T>>[0] => {
  return {
    ...config,
    params,
    url: ELECTRIC_BASE_URL,
    subscribe: !!accessToken && subscribe,
    backoffOptions,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

export const useShapeStream = <T extends Row<unknown> = Row<unknown>>(
  params: ElectricShapeOptions<T>,
  operations: Array<'insert' | 'update' | 'delete'>,
  onUpdate: (msg: ChangeMessage<T>) => void,
  subscribe: boolean = true,
  shouldUnsubscribe?: (d: { operationType: string; message: ChangeMessage<T> }) => boolean
) => {
  const accessToken = useGetSupabaseAccessToken();
  const memoParams = useMemo(() => params, [JSON.stringify(params)]);
  const abortRef = useRef<AbortController>(null);

  const createStream = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const opts = createElectricShape(memoParams, accessToken);

    //we use getShapeStream instead of ShapeStream to use global cache entry
    return getShapeStream<T>({
      ...opts,
      signal: controller.signal,
    });
  }, [accessToken, memoParams]);

  useEffect(() => {
    if (!subscribe) {
      return;
    }

    const stream = createStream();

    let hasSyncedInitial = false;

    const handler: Parameters<typeof stream.subscribe>[0] = (messages) => {
      for (const m of messages) {
        if (m.headers.control === 'up-to-date' || m.headers.control === 'snapshot-end') {
          hasSyncedInitial = true;
        } else if (
          hasSyncedInitial &&
          isChangeMessage(m) &&
          operations.includes(m.headers.operation)
        ) {
          if (shouldUnsubscribe?.({ operationType: m.headers.operation, message: m })) {
            tearDown();
            return;
          }
          onUpdate(m);
        }
      }
    };

    const unsubscribe = stream.subscribe(handler);

    // cleanup on unmount or deps-change
    return () => {
      tearDown();
    };

    function tearDown() {
      unsubscribe?.();
      abortRef.current?.abort();
    }
  }, [
    memoParams,
    accessToken,
    subscribe,
    operations.join(','), // primitive dep
  ]);
};
