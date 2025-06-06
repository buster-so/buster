'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

interface ThrottleOptions {
  wait?: number;
  leading?: boolean;
  trailing?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for generic function types
export function useThrottleFn<T extends (...args: any[]) => any>(
  fn: T,
  options: ThrottleOptions = {}
) {
  const { wait = 1000, leading = true, trailing = true } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastExecRef = useRef<number>(0);
  const argsRef = useRef<Parameters<T>>(undefined);
  const fnRef = useRef<T>(fn);

  // Update the function ref when fn changes
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const run = useMemoizedFn((...args: Parameters<T>): ReturnType<T> => {
    const now = Date.now();
    argsRef.current = args;

    const remaining = wait - (now - lastExecRef.current);

    if (remaining <= 0) {
      cancel();
      lastExecRef.current = now;
      return fnRef.current(...args);
    }

    if (trailing && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastExecRef.current = leading ? Date.now() : 0;
        timeoutRef.current = undefined;
        if (argsRef.current) {
          fnRef.current(...argsRef.current);
        }
      }, remaining);
    }

    return undefined as ReturnType<T>;
  });

  // Clean up timeout on unmount
  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    run,
    cancel
  };
}
