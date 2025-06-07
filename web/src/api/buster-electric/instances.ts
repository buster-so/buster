import { useShape as useElectricShape } from '@electric-sql/react';
import { ShapeStream, type BackoffOptions, type Row } from '@electric-sql/client';
import { ELECTRIC_BASE_URL } from './config';
import { useSupabaseContext } from '@/context/Supabase';
import { useEffect, useMemo } from 'react';

export type ElectricShapeOptions<T extends Row<unknown> = Row<unknown>> = Omit<
  Parameters<typeof useElectricShape<T>>[0],
  'url'
>;

const backoffOptions: BackoffOptions = {
  initialDelay: 1000,
  maxDelay: 10000,
  multiplier: 2
};

export const useShape = <T extends Row<unknown> = Row<unknown>>(
  params: ElectricShapeOptions<T>
): ReturnType<typeof useElectricShape<T>> => {
  const accessToken = useSupabaseContext((state) => state.accessToken);

  const shapeStream: Parameters<typeof useElectricShape<T>>[0] = useMemo(() => {
    return {
      ...params,
      url: ELECTRIC_BASE_URL,
      subscribe: !!accessToken,
      backoffOptions,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
  }, [accessToken, params]);

  return useElectricShape<T>(shapeStream);
};

export const useShapeStream = <T extends Row<unknown> = Row<unknown>>(
  params: ElectricShapeOptions<T>
) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);

  const shapeParams: Parameters<typeof useElectricShape<T>>[0] = useMemo(() => {
    return {
      ...params,
      url: ELECTRIC_BASE_URL,
      subscribe: !!accessToken,
      backoffOptions,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
  }, [accessToken, params]);

  useEffect(() => {
    const stream = new ShapeStream<T>(shapeParams);
    const rows: Record<string, T> = {};

    const unsubscribe = stream.subscribe((messages) => {
      // let changed = false;

      for (const msg of messages) {
        console.log(msg);
        const { operation } = msg.headers;
        // const id = msg.key;
        // if (operation === 'insert' || operation === 'update') {
        //   rows[id] = msg.value;
        //   changed = true;
        // }
        // if (operation === 'delete') {
        //   delete rows[id];
        //   changed = true;
        // }
      }

      // if (changed) {
      //   //  queryClient.setQueryData(queryKey, Object.values(rows));
      // }
    });

    return () => {
      unsubscribe();
    };
  });

  //
};

// Helper function to parse error message and extract JSON if present
const parseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message;

    // Try to extract JSON from the end of the error message
    const jsonMatch = message.match(/:\s*(\{.*\})$/);
    if (jsonMatch) {
      try {
        const parsedJson = JSON.parse(jsonMatch[1]);
        return parsedJson.message || message;
      } catch {
        // If JSON parsing fails, return the original message
        return message;
      }
    }

    return message;
  }

  return String(error);
};
