'use client';

import { useState, useEffect, useCallback } from 'react';

type SetState<S> = S | ((prevState?: S) => S);

interface Options<T> {
  defaultValue?: T | (() => T);
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: unknown) => void;
  bustStorageOnInit?: boolean;
}

export function useSessionStorageState<T>(
  key: string,
  options?: Options<T>
): [T | undefined, (value?: SetState<T>) => void] {
  const {
    defaultValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError,
    bustStorageOnInit = false
  } = options || {};

  // Get initial value from sessionStorage or use default
  const getInitialValue = useCallback((): T | undefined => {
    // If bustStorageOnInit is true, ignore sessionStorage and use default value
    if (bustStorageOnInit) {
      return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
      }
      return deserializer(item);
    } catch (error) {
      onError?.(error);
      return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    }
  }, [key, defaultValue, deserializer, onError, bustStorageOnInit]);

  const [state, setState] = useState<T | undefined>(getInitialValue);

  // Initialize state from sessionStorage on mount
  useEffect(() => {
    setState(getInitialValue());
  }, [getInitialValue]);

  // Update sessionStorage when state changes
  useEffect(() => {
    try {
      if (state === undefined) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, serializer(state));
      }
    } catch (error) {
      onError?.(error);
    }
  }, [key, state, serializer, onError]);

  // Setter function that handles both direct values and function updates
  const setStoredState = useCallback(
    (value?: SetState<T>) => {
      try {
        if (typeof value === 'function') {
          setState((prevState) => {
            const newState = (value as (prevState?: T) => T)(prevState);
            return newState;
          });
        } else {
          setState(value);
        }
      } catch (error) {
        onError?.(error);
      }
    },
    [onError]
  );

  return [state, setStoredState];
}
