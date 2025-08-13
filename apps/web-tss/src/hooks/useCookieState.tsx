'use client';

import { isServer } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useMemoizedFn } from './useMemoizedFn';
import { useMount } from './useMount';

type SetState<S> = S | ((prevState?: S) => S);

// Default expiration time: 7 days in milliseconds
const DEFAULT_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

interface StorageData<T> {
  value: T;
  timestamp: number;
}

interface CookieOptions {
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

interface Options<T> {
  defaultValue?: T | (() => T);
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: unknown) => void;
  bustStorageOnInit?: boolean | ((layout: T) => boolean);
  expirationTime?: number;
  cookieOptions?: CookieOptions;
  initialValue?: T;
}

// Helper function to parse cookies
const parseCookies = (): Record<string, string> => {
  if (isServer) return {};

  return document.cookie.split(';').reduce(
    (cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
      return cookies;
    },
    {} as Record<string, string>
  );
};

// Helper function to set a cookie
const setCookie = (
  name: string,
  value: string,
  expirationTime: number,
  options: CookieOptions = {}
): void => {
  if (isServer) return;

  const expires = new Date(Date.now() + expirationTime).toUTCString();
  const { domain, path = '/', secure = true, sameSite = 'lax' } = options;

  let cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=${sameSite}`;

  if (secure) {
    cookieString += '; Secure';
  }

  if (domain) {
    cookieString += `; Domain=${domain}`;
  }

  document.cookie = cookieString;
};

// Helper function to remove a cookie
const removeCookie = (name: string, options: CookieOptions = {}): void => {
  if (isServer) return;

  const { domain, path = '/' } = options;
  let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;

  if (domain) {
    cookieString += `; Domain=${domain}`;
  }

  document.cookie = cookieString;
};

export function useCookieState<T>(
  key: string,
  options?: Options<T>
): [T | undefined, (value?: SetState<T>) => void, () => T | undefined] {
  const {
    defaultValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError,
    bustStorageOnInit = false,
    expirationTime = DEFAULT_EXPIRATION_TIME,
    cookieOptions = {},
    initialValue
  } = options || {};

  const executeBustStorage = useMemoizedFn(() => {
    if (!isServer) removeCookie(key, cookieOptions);
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
  });

  // Get initial value from cookies or use default
  const getInitialValue = useMemoizedFn((): T | undefined => {
    // If bustStorageOnInit is true, ignore cookies and use default value
    if (bustStorageOnInit === true) {
      return executeBustStorage();
    }

    // If an explicit initialValue is provided, prefer it (subject to bust logic)
    if (initialValue !== undefined) {
      if (typeof bustStorageOnInit === 'function' && bustStorageOnInit(initialValue)) {
        return executeBustStorage();
      }
      return initialValue;
    }

    try {
      const cookies = parseCookies();
      const cookieValue = cookies[key];

      if (!cookieValue) {
        return executeBustStorage();
      }

      // Parse the stored data which includes value and timestamp
      const storageData: StorageData<T> = JSON.parse(cookieValue);

      // Check if the stored data has the expected structure
      if (
        typeof storageData !== 'object' ||
        storageData === null ||
        !('value' in storageData) ||
        !('timestamp' in storageData)
      ) {
        // If the data doesn't have the expected structure (legacy data), treat as expired
        return executeBustStorage();
      }

      // Check if the data has expired
      const currentTime = Date.now();
      const timeDifference = currentTime - storageData.timestamp;

      if (timeDifference > expirationTime) {
        // Data has expired, remove it and return default value
        return executeBustStorage();
      }

      // Data is still valid, deserialize and return the value
      const deserializedValue = deserializer(JSON.stringify(storageData.value));

      if (typeof bustStorageOnInit === 'function' && bustStorageOnInit(deserializedValue)) {
        return executeBustStorage();
      }

      return deserializedValue;
    } catch (error) {
      onError?.(error);
      return executeBustStorage();
    }
  });

  const [state, setState] = useState<T | undefined>(() => getInitialValue());

  // Initialize state from cookies on mount
  useMount(() => {
    setState(getInitialValue());
  });

  // Update cookies when state changes
  useEffect(() => {
    try {
      if (state === undefined && !isServer) {
        removeCookie(key, cookieOptions);
      } else {
        // Create storage data with current timestamp
        const storageData: StorageData<T> = {
          value: JSON.parse(serializer(state)),
          timestamp: Date.now()
        };
        setCookie(key, JSON.stringify(storageData), expirationTime, cookieOptions);
      }
    } catch (error) {
      onError?.(error);
    }
  }, [key, state, serializer, onError, expirationTime, cookieOptions]);

  // Setter function that handles both direct values and function updates
  const setStoredState = useMemoizedFn((value?: SetState<T>) => {
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
  });

  return [state, setStoredState, executeBustStorage];
}
