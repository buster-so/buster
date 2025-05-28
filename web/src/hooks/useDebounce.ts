'use client';

import { isDev } from '@/config';
import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useLatest from './useLatest';
import { useUnmount } from './useUnmount';

interface DebounceOptions {
  wait?: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: Required for generic function types
type noop = (...args: any[]) => any;

export function useDebounceFn<T extends noop>(fn: T, options?: DebounceOptions) {
  if (isDev) {
    if (!isFunction(fn)) {
      console.error(`useDebounceFn expected parameter is a function, got ${typeof fn}`);
    }
  }

  const fnRef = useLatest(fn);

  const wait = options?.wait ?? 1000;

  const debounced = useMemo(
    () =>
      debounce(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options
      ),
    []
  );

  useUnmount(() => {
    debounced.cancel();
  });

  return {
    run: debounced,
    cancel: debounced.cancel,
    flush: debounced.flush
  };
}

export function useDebounce<T>(value: T, options: DebounceOptions = {}) {
  const { wait = 1000, maxWait, leading = false, trailing = true } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastUpdateTime = useRef<number>(Date.now());
  const valueRef = useRef<T>(value);
  const isFirstCallRef = useRef<boolean>(true);

  // Keep latest value in ref
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Clear both timeouts on cleanup
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }

    isFirstCallRef.current = true;
  }, []);

  useEffect(() => {
    clearTimeouts();
    const now = Date.now();

    // Handle leading edge
    if (leading && isFirstCallRef.current) {
      setDebouncedValue(value);
      lastUpdateTime.current = now;
      isFirstCallRef.current = false;
      return;
    }

    // Only set up trailing timeout if trailing is true
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(valueRef.current);
        lastUpdateTime.current = Date.now();
      }, wait);
    }

    // Handle maxWait
    if (maxWait) {
      const timeSinceLastUpdate = now - lastUpdateTime.current;
      const maxWaitTimeRemaining = Math.max(0, maxWait - timeSinceLastUpdate);

      maxTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          setDebouncedValue(valueRef.current);
          lastUpdateTime.current = Date.now();
        }
      }, maxWaitTimeRemaining);
    }

    isFirstCallRef.current = false;
    return () => clearTimeouts();
  }, [value, wait, maxWait, leading, trailing, clearTimeouts]);

  return debouncedValue;
}
