import { useShape as useElectricShape, getShapeStream } from '@electric-sql/react';
import {
  ChangeMessage,
  isChangeMessage,
  type BackoffOptions,
  type Row
} from '@electric-sql/client';
import { ELECTRIC_BASE_URL } from './config';
import { useSupabaseContext } from '@/context/Supabase';
import { useEffect, useMemo, useRef } from 'react';
import findLast from 'lodash/findLast';

export type ElectricShapeOptions<T extends Row<unknown> = Row<unknown>> = Omit<
  Parameters<typeof useElectricShape<T>>[0],
  'url'
>;

const backoffOptions: BackoffOptions = {
  initialDelay: 1000,
  maxDelay: 10000,
  multiplier: 2
};

const createElectricShape = <T extends Row<unknown> = Row<unknown>>(
  { params, subscribe = true, ...config }: ElectricShapeOptions<T>,
  accessToken: string
): Parameters<typeof useElectricShape<T>>[0] => {
  return {
    ...config,
    params: {
      ...params,
      replica: 'default'
    },
    url: ELECTRIC_BASE_URL,
    subscribe: !!accessToken && subscribe,
    backoffOptions,
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  };
};

export const useShape = <T extends Row<unknown> = Row<unknown>>(
  params: ElectricShapeOptions<T>
): ReturnType<typeof useElectricShape<T>> => {
  const accessToken = useSupabaseContext((state) => state.accessToken);

  const shapeStream: Parameters<typeof useElectricShape<T>>[0] = useMemo(() => {
    return createElectricShape(params, accessToken);
  }, [accessToken, params]);

  return useElectricShape<T>(shapeStream);
};

export const useShapeStream = <T extends Row<unknown> = Row<unknown>>(
  params: ElectricShapeOptions<T>,
  operations: Array<`insert` | `update` | `delete`>,
  onUpdate: (rows: ChangeMessage<T>) => void,
  subscribe: boolean = true,
  shouldUnsubscribe?: (d: { operationType: string; message: ChangeMessage<T> }) => boolean
) => {
  const controller = useRef(new AbortController());
  const hasSubscribed = useRef(false);
  const accessToken = useSupabaseContext((state) => state.accessToken);

  const shapeParams: Parameters<typeof useElectricShape<T>>[0] = useMemo(() => {
    return { ...createElectricShape(params, accessToken), signal: controller.current.signal };
  }, [accessToken, params]);

  const stream = useMemo(() => getShapeStream<T>(shapeParams), [shapeParams]);

  useEffect(() => {
    if (!subscribe) {
      if (hasSubscribed.current) quit();
      return;
    }

    hasSubscribed.current = true;
    const unsubscribe = stream.subscribe((messages) => {
      if (!hasSubscribed.current) {
        hasSubscribed.current = true;
      }

      // Single-pass filtering and processing for better efficiency
      let combinedValue = {} as T;
      let lastMessage: ChangeMessage<T> | null = null;

      for (const message of messages) {
        if (isChangeMessage(message) && operations.includes(message.headers.operation)) {
          const changeMessage = message as ChangeMessage<T>;
          // Use Object.assign for better performance than spread operator
          Object.assign(combinedValue, changeMessage.value);
          lastMessage = changeMessage;
        }
      }

      if (!lastMessage) {
        return;
      }

      const filteredMessage: ChangeMessage<T> = {
        key: lastMessage.key,
        value: combinedValue,
        headers: lastMessage.headers
      };
      const __headers__ = lastMessage.headers;

      const isUnsubscribedTriggered =
        shouldUnsubscribe &&
        shouldUnsubscribe({
          //there is a bug here, operation type is not actually the operation type haha
          operationType: __headers__.operation as `insert` | `update` | `delete`,
          message: filteredMessage
        });

      if (filteredMessage) {
        console.log('filteredMessage', filteredMessage);
        onUpdate(filteredMessage);
      }

      if (isUnsubscribedTriggered) {
        unsubscribe();
        quit();
        return;
      }
    });

    return () => {
      unsubscribe();
      quit();
    };

    function quit() {
      controller.current.abort();
      stream.unsubscribeAll();
    }
  }, [operations, onUpdate, shouldUnsubscribe, shapeParams, subscribe]);
};
