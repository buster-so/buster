'use client';

import { useMemoizedFn } from 'ahooks';
import React, { useMemo, useRef } from 'react';
import { useBusterNotifications } from '../BusterNotifications/BusterNotifications';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useWebSocket } from './useWebSocketCustom';
import { BusterSocketResponseBase } from '@/api/buster_socket/baseInterfaces';
import { useSupabaseContext } from '../Supabase';
import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';
import { SupabaseContextReturnType } from '../Supabase';

const BUSTER_WS_URL = `${process.env.NEXT_PUBLIC_WEB_SOCKET_URL}/api/v1/ws`;

export type BusterOnCallback = {
  callback: BusterSocketResponse['callback'];
  onError?: BusterSocketResponse['onError'];
};

export enum ReadyState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3
}

interface BusterSocket {
  on: (d: BusterSocketResponse) => void;
  off: (d: BusterSocketResponse) => void;
  emit: (d: BusterSocketRequest) => void;
  once: (d: BusterSocketResponse) => Promise<unknown>;
  emitAndOnce: (d: {
    emitEvent: BusterSocketRequest;
    responseEvent: BusterSocketResponse;
  }) => Promise<unknown>;
}

export const useBusterWebSocketHook = ({
  socketURL,
  accessToken,
  checkTokenValidity
}: {
  socketURL: string;
  accessToken: string | undefined;
  checkTokenValidity: SupabaseContextReturnType['checkTokenValidity'];
}) => {
  const { openErrorNotification } = useBusterNotifications();

  const onMessage = useMemoizedFn((responseMessage: BusterSocketResponseBase<string, any>) => {
    try {
      const { route, payload, error } = responseMessage;
      const eventListeners = getCurrentListeners(route);

      // Batch multiple updates using requestAnimationFrame
      if (eventListeners.length > 0) {
        requestAnimationFrame(() => {
          const eventListeners = getCurrentListeners(route);
          eventListeners.forEach(({ callback: cb, onError: onE }) => {
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
          });
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
    canConnect: !!accessToken,
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
  openErrorNotification: (d: any) => void;
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
      const onceCallback = (payload: any) => {
        callback(payload);
        off({ route: route as '/threads/list:getThreadsList', callback: onceCallback });
        resolve(payload);
      };
      const onError = (error: any) => {
        off({ route: route as '/threads/list:getThreadsList', callback: onceCallback });
        reject(error);
      };
      on({
        route: route as '/threads/list:getThreadsList',
        callback: onceCallback,
        onError
      });
    });
  });

  const emitAndOnce: BusterSocket['emitAndOnce'] = useMemoizedFn(async (params) => {
    const { emitEvent, responseEvent } = params;
    const { route, callback, onError } = responseEvent;
    const promise = new Promise((resolve, reject) => {
      const promiseCallback = (d: any) => {
        callback(d);
        resolve(d);
      };
      const onErrorCallback = (d: any) => {
        if (!onError) openErrorNotification(d);
        else onError?.(d);
        reject(d);
      };
      once({
        route: route as '/threads/list:getThreadsList',
        callback: promiseCallback,
        onError: onErrorCallback
      }).catch((e) => {
        onErrorCallback(e);
      });
    });
    emit(emitEvent);
    return promise;
  });

  const getCurrentListeners = useMemoizedFn((route: BusterSocketResponseRoute | string) => {
    return listeners.current[route] || [];
  });

  const busterSocket: BusterSocket = useMemo(
    () => ({
      on,
      off,
      emit,
      once,
      emitAndOnce
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
}> = React.memo(({ children }) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const checkTokenValidity = useSupabaseContext((state) => state.checkTokenValidity);

  const value = useBusterWebSocketHook({
    socketURL: BUSTER_WS_URL,
    accessToken,
    checkTokenValidity
  });

  return <BusterWebSocket.Provider value={value}>{children}</BusterWebSocket.Provider>;
});
BusterWebSocketProvider.displayName = 'BusterWebSocketProvider';

const useBusterWebSocketSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterWebSocketHook>, T>
) => useContextSelector(BusterWebSocket, selector);

export const useBusterWebSocket = () => {
  return useBusterWebSocketSelector((state) => state.busterSocket);
};

export const useBusterWebSocketConnectionStatus = () => {
  return useBusterWebSocketSelector((state) => state.connectionStatus);
};
