import { useMemoizedFn } from 'ahooks';
import { useContext, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { createBusterResponse } from './helpers';
import { BusterSocketResponse, BusterSocketResponseRoute } from '@/api/buster_socket';
import { useBusterNotifications } from '../BusterNotifications/BusterNotifications';
import { BusterOnCallback } from './useBusterWebSocket';

export const useBusterSocketWorkers = ({
  socketURLWithAuth,
  canConnectSocket,
  onMessage,
  getCurrentListeners
}: {
  socketURLWithAuth?: string;
  canConnectSocket?: boolean;
  onMessage: (d: MessageEvent) => void;
  getCurrentListeners: (route: BusterSocketResponseRoute | string) => BusterOnCallback[];
}) => {
  const { openErrorNotification } = useBusterNotifications();
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('./socketWorker', import.meta.url));
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const onMessageWorker = useMemoizedFn((d: MessageEvent) => {
    const isGeneratingDescription = false;
    if (workerRef.current && isGeneratingDescription) {
      workerRef.current?.postMessage(d.data);
    } else onMessage(d);
  });

  const handleParsedMessage = useMemoizedFn((data) => {
    const responseMessage = createBusterResponse(data);
    const { route, payload, error } = responseMessage;
    const eventListeners = getCurrentListeners(route);
    eventListeners.forEach(({ callback: cb, onError: onE }) => {
      if (error) {
        console.error('Error in socket message:', error);
        if (onE) onE(error);
        else openErrorNotification(error);
      } else cb(payload);
    });
  });

  useEffect(() => {
    const worker = workerRef.current;
    if (worker) {
      worker.onmessage = (e) => {
        const { type, data, error, ogData } = e.data;
        if (type === 'parsed') {
          handleParsedMessage(data);
        } else if (type === 'error') {
          console.error('Error in socket callback:', error);
          openErrorNotification(error);
        }
      };
    }
  }, [openErrorNotification]);

  // const socketIsConnected = readyState === ReadyState.OPEN;

  return {
    onMessageWorker
    // sendMessage: _sendMessage,
    // sendJsonMessage
  };
};
