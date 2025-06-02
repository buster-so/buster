'use client';

import { useState, useEffect, useCallback } from 'react';

type SetState<S> = S | ((prevState?: S) => S);

interface Options<T> {
  defaultValue?: T | (() => T);
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: unknown) => void;
}

export function useLocalStorageState<T>(
  key: string,
  options?: Options<T>
): [T | undefined, (value?: SetState<T>) => void] {
  const {
    defaultValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError
  } = options || {};

  // Get initial value from localStorage or use default
  const getInitialValue = useCallback((): T | undefined => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
      }
      return deserializer(item);
    } catch (error) {
      onError?.(error);
      return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
    }
  }, [key, defaultValue, deserializer, onError]);

  const [state, setState] = useState<T | undefined>(getInitialValue);

  // Initialize state from localStorage on mount
  useEffect(() => {
    setState(getInitialValue());
  }, [getInitialValue]);

  // Update localStorage when state changes
  useEffect(() => {
    try {
      if (state === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, serializer(state));
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
