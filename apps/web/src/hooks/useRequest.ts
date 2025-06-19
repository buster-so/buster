'use client';

import { useEffect, useState } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

type Service<TData> = () => Promise<TData>;

interface Options {
  manual?: boolean;
}

interface Result<TData> {
  loading: boolean;
  error: Error | null;
  data: TData | undefined;
  run: () => void;
  runAsync: () => Promise<TData>;
}

export function useRequest<TData>(service: Service<TData>, options: Options = {}): Result<TData> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData>();
  const { manual = false } = options;

  const runAsync = useMemoizedFn(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await service();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  });

  const run = useMemoizedFn(() => {
    runAsync().catch((error) => {
      console.error('useRequest error:', error);
    });
  });

  useEffect(() => {
    if (!manual) {
      run();
    }
  }, [manual]);

  return {
    loading,
    error,
    data,
    runAsync,
    run
  };
}
