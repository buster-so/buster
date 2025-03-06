'use client';

import { useMemoizedFn } from 'ahooks';
import React, { useMemo, useRef } from 'react';
import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useWebSocket } from '@/hooks/useWebSocket';
import { BusterSocketResponseBase } from '@/api/buster_socket/base_interfaces';
import { useSupabaseContext } from '../../Supabase';
import { createContext, useContextSelector } from 'use-context-selector';
import { SupabaseContextReturnType } from '../../Supabase';
import { useBusterNotifications } from '@/context/BusterNotifications';

const BUSTER_WS_URL = `${process.env.NEXT_PUBLIC_WEB_SOCKET_URL}/api/v1/ws`;

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
        off({ route: route as '/metrics/list:getMetricList', callback: onceCallback });
        resolve(payload);
      };
      const onError = (error: any) => {
        off({ route: route as '/metrics/list:getMetricList', callback: onceCallback });
        reject(error);
      };
      on({
        route: route as '/metrics/list:getMetricList',
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
        route: route as '/metrics/list:getMetricList',
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
}> = React.memo(({ children }) => {
  const accessToken = useSupabaseContext((state) => state.accessToken);
  const checkTokenValidity = useSupabaseContext((state) => state.checkTokenValidity);

  const busterSocketHook = useBusterWebSocketHook({
    socketURL: BUSTER_WS_URL,
    accessToken,
    checkTokenValidity
  });

  return <BusterWebSocket.Provider value={busterSocketHook}>{children}</BusterWebSocket.Provider>;
});
BusterWebSocketProvider.displayName = 'BusterWebSocketProvider';

const useBusterWebSocketSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterWebSocketHook>) => T
) => useContextSelector(BusterWebSocket, selector);

export const useBusterWebSocket = () => {
  return useBusterWebSocketSelector((state) => state.busterSocket);
};
