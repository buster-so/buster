'use client';

import React, { useMemo, useRef } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import type { BusterSocketResponseBase } from '@/api/buster_socket/base_interfaces';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { SupabaseContextReturnType } from '../../Supabase';
import { useSupabaseContext } from '../../Supabase';
import { BUSTER_WS_URL } from './config';

export type BusterOnCallback = {
  callback: BusterSocketResponse['callback'];
  onError?: BusterSocketResponse['onError'];
};

interface BusterSocket {
  on: (d: BusterSocketResponse) => void;
  off: (d: BusterSocketResponse) => void;
  emit: (d: BusterSocketRequest) => void;
  once: <T extends BusterSocketResponse>(d: T) => Promise<Parameters<T['callback']>[0]>;
  emitAndOnce: <T extends BusterSocketResponse>(d: {
    emitEvent: BusterSocketRequest;
    responseEvent: T;
  }) => Promise<Parameters<T['callback']>[0]>;
  getCurrentListeners: (route: BusterSocketResponseRoute) => BusterOnCallback[];
}

const useBusterWebSocketHook = ({
  socketURL,
  accessToken,
  checkTokenValidity,
  isAnonymousUser
}: {
  socketURL: string;
  accessToken: string | undefined;
  checkTokenValidity: SupabaseContextReturnType['checkTokenValidity'];
  isAnonymousUser: boolean;
}) => {
  const { openErrorNotification } = useBusterNotifications();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this truly can be anything
  const onMessage = useMemoizedFn((responseMessage: BusterSocketResponseBase<string, any>) => {
    try {
      const { route, payload, error } = responseMessage;
      const eventListeners = getCurrentListeners(route);

      // Batch multiple updates using requestAnimationFrame
      if (eventListeners.length > 0) {
        requestAnimationFrame(() => {
          const eventListeners = getCurrentListeners(route);
          for (const { callback: cb, onError: onE } of eventListeners) {
            if (error) {
              if (onE) onE(error);
              else openErrorNotification(error);
            } else {
              try {
                cb(payload);
              } catch (callbackError) {
                console.error('Error in callback:', callbackError);
                openErrorNotification(callbackError);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error in socket callback:', error);
      openErrorNotification(error);
    }
  });

  const { sendJSONMessage, connectionStatus } = useWebSocket({
    url: socketURL,
    onMessage,
    canConnect: !!accessToken && !isAnonymousUser,
    checkTokenValidity
  });

  const emit = useMemoizedFn((d: BusterSocketRequest) => {
    sendJSONMessage(d);
  });

  const { getCurrentListeners, busterSocket } = useBusterSocketListeners({
    openErrorNotification,
    emit
  });

  return { busterSocket, connectionStatus };
};
interface EventListeners {
  [key: string]: BusterOnCallback[];
}

const useBusterSocketListeners = (props: {
  openErrorNotification: (d: unknown) => void;
  emit: (d: BusterSocketRequest) => void;
}) => {
  const { emit, openErrorNotification } = props;
  const listeners = useRef<EventListeners>({});

  const on: BusterSocket['on'] = useMemoizedFn(({ route, callback, onError }) => {
    const currentListeners = getCurrentListeners(route);
    const newCallbacks = [...currentListeners, { callback, onError }];
    listeners.current[route] = newCallbacks;
  });

  const off: BusterSocket['off'] = useMemoizedFn(({ route, callback }) => {
    const currentListeners = getCurrentListeners(route);
    const newListeners = currentListeners.filter(({ callback: cb }) => {
      return cb !== callback;
    });
    listeners.current[route] = newListeners;
  });

  const once: BusterSocket['once'] = useMemoizedFn(({ route, callback }) => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this truly can be anything
      const onceCallback = (payload: any) => {
        callback(payload);
        off({ route: route as '/chats/post:initializeChat', callback: onceCallback });
        resolve(payload);
      };
      const onError = (error: unknown) => {
        off({ route: route as '/chats/post:initializeChat', callback: onceCallback });
        reject(error);
      };
      on({
        route: route as '/chats/post:initializeChat',
        callback: onceCallback,
        onError
      });
    });
  });

  const emitAndOnce: BusterSocket['emitAndOnce'] = useMemoizedFn(
    async <T extends BusterSocketResponse>(params: {
      emitEvent: BusterSocketRequest;
      responseEvent: T;
    }) => {
      const { emitEvent, responseEvent } = params;
      const { route, callback, onError } = responseEvent;
      const promise = new Promise<Parameters<T['callback']>[0]>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this truly can be anything
        const promiseCallback = (d: any) => {
          callback(d);
          resolve(d);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this truly can be anything
        const onErrorCallback = (d: any) => {
          if (!onError) openErrorNotification(d);
          else onError?.(d);
          reject(d);
        };
        once({
          route: route as '/chats/post:initializeChat',
          callback: promiseCallback,
          onError: onErrorCallback
        }).catch((e) => {
          onErrorCallback(e);
        });
      });
      emit(emitEvent);
      return promise;
    }
  );

  const getCurrentListeners = useMemoizedFn((route: BusterSocketResponseRoute | string) => {
    return listeners.current[route] || [];
  });

  const busterSocket: BusterSocket = useMemo(
    () => ({
      on,
      off,
      emit,
      once,
      emitAndOnce,
      getCurrentListeners: getCurrentListeners
    }),
    []
  );

  return {
    busterSocket,
    getCurrentListeners,
    listeners
  };
};

const BusterWebSocket = createContext<ReturnType<typeof useBusterWebSocketHook>>(
  {} as ReturnType<typeof useBusterWebSocketHook>
);

export const BusterWebSocketProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const isAnonymousUser = useSupabaseContext((x) => x.isAnonymousUser);
  const checkTokenValidity = useSupabaseContext((state) => state.checkTokenValidity);
  const busterSocketHook = useBusterWebSocketHook({
    socketURL: BUSTER_WS_URL,
    isAnonymousUser,
    accessToken,
    checkTokenValidity
  });

  return <BusterWebSocket.Provider value={busterSocketHook}>{children}</BusterWebSocket.Provider>;
};
BusterWebSocketProvider.displayName = 'BusterWebSocketProvider';

const useBusterWebSocketSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterWebSocketHook>) => T
) => useContextSelector(BusterWebSocket, selector);

export const useBusterWebSocket = () => {
  return useBusterWebSocketSelector((state) => state.busterSocket);
};
