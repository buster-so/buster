import { useCallback, useEffect, useRef, useState } from 'react';
import { useMemoizedFn } from './useMemoizedFn';

/**
 * A hook that provides a safe way to use setTimeout in React components.
 * The timeout will be automatically cleared when the component unmounts.
 * The callback and delay will be properly updated when they change.
 *
 * @param callback The function to be called after the timeout
 * @param delay The delay in milliseconds before calling the callback. If null, the timeout is paused
 * @returns An object containing functions to control the timeout
 *
 * @example
 * ```tsx
 * const { start, stop, reset, isActive } = useSetTimeout(() => {
 *   //
 * }, 1000);
 * ```
 */
export function useSetTimeout(callback: () => void, delay: number | null) {
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const savedCallback = useMemoizedFn(callback);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (delay !== null) {
      setIsActive(true);
      timeoutRef.current = setTimeout(() => {
        savedCallback();
        setIsActive(false);
      }, delay);
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          setIsActive(false);
        }
      };
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsActive(false);
    }
  }, [delay, savedCallback]);

  const start = useCallback(() => {
    if (!isActive && delay !== null) {
      setIsActive(true);
      timeoutRef.current = setTimeout(() => {
        savedCallback();
        setIsActive(false);
      }, delay);
    }
  }, [delay, isActive, savedCallback]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsActive(false);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    start();
  }, [start, stop]);

  return { start, stop, reset, isActive } as const;
}
