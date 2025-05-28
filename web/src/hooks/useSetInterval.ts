'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

/**
 * A hook that provides a safe way to use setInterval in React components.
 * The interval will be automatically cleared when the component unmounts.
 * The callback and delay will be properly updated when they change.
 *
 * @param callback The function to be called at each interval
 * @param delay The delay in milliseconds between each call. If null, the interval is paused
 * @returns An object containing functions to control the interval
 *
 * @example
 * ```tsx
 * const { start, stop, isActive } = useSetInterval(() => {
 *   //
 * }, 1000);
 * ```
 */
export function useSetInterval(callback: () => void, delay: number | null) {
  const intervalRef = useRef<NodeJS.Timeout>();
  const savedCallback = useMemoizedFn(callback);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (delay !== null) {
      setIsActive(true);
      intervalRef.current = setInterval(() => savedCallback(), delay);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          setIsActive(false);
        }
      };
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsActive(false);
    }
  }, [delay, savedCallback]);

  const start = useCallback(() => {
    if (!isActive && delay !== null) {
      setIsActive(true);
      intervalRef.current = setInterval(() => savedCallback(), delay);
    }
  }, [delay, isActive, savedCallback]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setIsActive(false);
    }
  }, []);

  return { start, stop, isActive } as const;
}
