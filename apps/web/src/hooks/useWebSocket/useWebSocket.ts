'use client';

import { useEffect, useRef, useState } from 'react';
import type { BusterSocketResponseBase } from '@/api/buster_socket/base_interfaces';
import type { SupabaseContextReturnType } from '@/context/Supabase';
import { useMemoizedFn, useMount, useNetwork, useThrottleFn, useWindowFocus } from '@/hooks';
import { ReadyState } from './config';
import { type DeviceCapabilities, getDeviceCapabilities } from './deviceCapabilities';
import { createBusterResponse } from './helpers';

type WebSocketHookProps = {
  canConnect: boolean;
  url: string;
  checkTokenValidity: SupabaseContextReturnType['checkTokenValidity'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic message data type for WebSocket responses
  onMessage: (data: BusterSocketResponseBase<string, any>) => void; // Required prop for handling messages
};

interface QueuedMessage {
  data: MessageEvent['data'];
  timestamp: number;
}

const BASE_DELAY = 3000;

const useWebSocket = ({ url, checkTokenValidity, canConnect, onMessage }: WebSocketHookProps) => {
  const { online } = useNetwork();
  const messageQueue = useRef<QueuedMessage[]>([]); // Updated queue type
  const processing = useRef<boolean>(false); // Flag to indicate if processing is ongoing
  const rafId = useRef<number | null>(null); // Track scheduled RAF to allow cancellation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic message queue for WebSocket data
  const sendQueue = useRef<Record<string, any>[]>([]); // Queue to store messages to be sent
  const ws = useRef<WebSocket | null>(null);
  const capabilities = useRef<DeviceCapabilities | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ReadyState>(ReadyState.Closed);

  // Add state for connection errors
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleVisibilityChange = useMemoizedFn(() => {
    if (document.visibilityState === 'visible') {
      connectWebSocket();
    }
  });

  const processMessage = useMemoizedFn((message: MessageEvent['data']) => {
    try {
      const data = JSON.parse(message);
      const responseMessage = createBusterResponse(data);
      if (responseMessage?.route) {
        // Use requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
          onMessage(responseMessage);
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  const processQueue = useMemoizedFn(() => {
    if (!capabilities.current || processing.current) {
      return;
    }

    processing.current = true;
    const { maxMessagesPerFrame, processTime } = capabilities.current;

    const processMessages = () => {
      const startTime = performance.now();
      let messagesProcessed = 0;

      // Process regular queue with remaining time
      while (
        messageQueue.current.length > 0 &&
        messagesProcessed < maxMessagesPerFrame &&
        performance.now() - startTime < processTime
      ) {
        const message = messageQueue.current.shift();
        if (message) {
          processMessage(message.data);
          messagesProcessed++;
        }
      }

      // Adaptive processing: Adjust timing based on performance
      const processingTime = performance.now() - startTime;
      if (processingTime < processTime * 0.8 && capabilities.current) {
        // If processing is fast, temporarily increase message processing capacity
        capabilities.current.maxMessagesPerFrame = Math.min(
          capabilities.current.maxMessagesPerFrame + 5,
          50
        );
      } else if (processingTime > processTime * 0.9 && capabilities.current) {
        // If processing is slow, reduce message processing capacity
        capabilities.current.maxMessagesPerFrame = Math.max(
          capabilities.current.maxMessagesPerFrame - 2,
          5
        );
      }

      if (messageQueue.current.length > 0) {
        rafId.current = requestAnimationFrame(processMessages);
      } else {
        processing.current = false;
      }
    };

    rafId.current = requestAnimationFrame(processMessages);
  });

  const handleIncomingMessage = useMemoizedFn((event: MessageEvent) => {
    try {
      const queuedMessage: QueuedMessage = {
        data: event.data,
        timestamp: Date.now()
      };

      // Cap the queue size to avoid unbounded growth
      const MAX_QUEUE = 2000;
      messageQueue.current.push(queuedMessage);
      if (messageQueue.current.length > MAX_QUEUE) {
        // Drop oldest messages to keep memory bounded
        messageQueue.current.splice(0, messageQueue.current.length - MAX_QUEUE);
      }

      if (!processing.current) {
        processQueue();
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic data type for WebSocket messages
  const sendJSONMessage = useMemoizedFn(async (data: Record<string, any>, isFromQueue = false) => {
    try {
      await checkTokenValidity(); //needed! This will refresh the token if it is expired. All other messages will be queued until the token is refreshed.
    } catch (error) {
      console.error('Token validation failed before sending WebSocket message:', error);
      if (!isFromQueue) {
        sendQueue.current.push(data); // Queue the message for retry
      }
      return;
    }
    
    if (ws.current?.readyState === ReadyState.Closed) {
      connectWebSocket();
    }
    if (ws.current && ws.current.readyState === ReadyState.Open) {
      ws.current.send(JSON.stringify(data));
    } else if (!isFromQueue) {
      sendQueue.current.push(data); // Queue the message if not connected
    }
  });

  const disconnect = useMemoizedFn(() => {
    if (ws.current) {
      ws.current.close();
    }
  });

  const { run: connectWebSocket } = useThrottleFn(
    useMemoizedFn(() => {
      if (
        ws.current?.readyState === ReadyState.Connecting ||
        ws.current?.readyState === ReadyState.Open
      )
        return;

      // Reset error state on new connection attempt
      setConnectionError(null);

      // Use fetch to check connection first and get headers
      checkTokenValidity()
        .then(({ access_token, isTokenValid }) => {
          if (!isTokenValid) {
            console.warn('Token is invalid, skipping WebSocket connection');
            setConnectionError('Invalid authentication token');
            return;
          }
          // If fetch succeeds, establish WebSocket connection
          const socketURLWithAuth = `${url}?authentication=${access_token}`;
          ws.current = new WebSocket(socketURLWithAuth);
          setupWebSocketHandlers();
        })
        .catch((error) => {
          console.error('Connection error:', error);
          setConnectionError(error.message || 'Authentication failed');
        });
    }),
    { wait: BASE_DELAY }
  );

  const setupWebSocketHandlers = useMemoizedFn(() => {
    if (!ws.current) return;

    ws.current.onopen = () => {
      setConnectionError(null);

      while (sendQueue.current.length > 0) {
        const message = sendQueue.current.shift();
        if (message) {
          sendJSONMessage(message, true);
        }
      }
      setConnectionStatus(ReadyState.Open);
    };

    ws.current.onclose = (event: CloseEvent) => {
      setConnectionStatus(ReadyState.Closed);
    };

    ws.current.onerror = (event: Event) => {
      const wsEvent = event as ErrorEvent;
      setConnectionError(wsEvent.message || 'WebSocket error occurred');
      console.error('WebSocket error:', wsEvent, wsEvent.message);
      setConnectionStatus(ReadyState.Closed);
    };

    ws.current.onmessage = handleIncomingMessage;
  });

  //initial mount
  useEffect(() => {
    if (canConnect && ws.current?.readyState !== ReadyState.Open) {
      connectWebSocket();
    }
  }, [canConnect, connectWebSocket]);

  useEffect(() => {
    if (!online) disconnect();
    //I chose not to connectWebSocket because I opted to use it when a message is sent?
  }, [online, disconnect]);

  // Initialize device capabilities
  useMount(() => {
    getDeviceCapabilities().then((caps) => {
      capabilities.current = caps;
    });
  });

  useWindowFocus(() => {
    handleVisibilityChange();
  });

  // Cleanup on unmount: close socket, clear queues, cancel RAF
  useEffect(() => {
    return () => {
      try {
        if (ws.current) {
          // Remove handlers to avoid retaining closures
          ws.current.onopen = null;
          ws.current.onclose = null;
          ws.current.onerror = null;
          ws.current.onmessage = null;
          ws.current.close();
        }
      } catch {
        // noop
      }
      ws.current = null;
      messageQueue.current = [];
      sendQueue.current = [];
      processing.current = false;
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      setConnectionStatus(ReadyState.Closed);
    };
  }, []);

  return {
    sendJSONMessage,
    disconnect,
    connectionError,
    connectionStatus
  };
};

export { useWebSocket };
