import { useShape as useElectricShape, getShapeStream } from '@electric-sql/react';
import {
  ChangeMessage,
  isChangeMessage,
  Message,
  ShapeStream,
  type BackoffOptions,
  type Row
} from '@electric-sql/client';
import { ELECTRIC_BASE_URL } from './config';
import { useSupabaseContext } from '@/context/Supabase';
import { useEffect, useMemo } from 'react';
import { useWhyDidYouUpdate } from '@/hooks';

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
  params: ElectricShapeOptions<T>,
  accessToken: string
): Parameters<typeof useElectricShape<T>>[0] => {
  return {
    ...params,
    url: ELECTRIC_BASE_URL,
    subscribe: !!accessToken && (params.subscribe ?? true),
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
  onUpdate: (rows: ChangeMessage<T>[]) => void,
  subscribe: boolean = true,
  shouldUnsubscribe?: (d: { operationType: string; message: ChangeMessage<T> }) => boolean
) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);

  const shapeParams: Parameters<typeof useElectricShape<T>>[0] = useMemo(() => {
    return createElectricShape(params, accessToken);
  }, [accessToken, params]);

  const stream = useMemo(() => getShapeStream<T>(shapeParams), [shapeParams]);

  useEffect(() => {
    if (!subscribe) {
      return;
    }

    const unsubscribe = stream.subscribe((messages) => {
      const filteredMessages = messages.filter(
        (m) =>
          isChangeMessage(m) &&
          m.value &&
          operations.includes(m.headers.operation as `insert` | `update` | `delete`)
      ) as ChangeMessage<T>[];

      const isUnsubscribed =
        shouldUnsubscribe &&
        filteredMessages.some((message) =>
          shouldUnsubscribe({
            operationType: message.headers.operation as `insert` | `update` | `delete`,
            message
          })
        );

      if (filteredMessages.length > 0) {
        onUpdate(filteredMessages);
      }

      if (isUnsubscribed) {
        unsubscribe();
        return;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [operations, onUpdate, shouldUnsubscribe, shapeParams, subscribe]);
};
