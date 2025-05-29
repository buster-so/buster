'use client';

import type {
  BusterSocketRequest,
  BusterSocketResponse,
  BusterSocketResponseRoute
} from '@/api/buster_socket';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from '@/hooks';
import {
  type MutationFunction,
  type QueryKey,
  type UseQueryOptions,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';
import isEmpty from 'lodash/isEmpty';
import type {
  BusterSocketRequestRoute,
  InferBusterSocketRequestPayload,
  InferBusterSocketResponseData
} from './types';

/**
 * A custom hook that combines WebSocket communication with React Query's mutation capabilities.
 * This hook allows you to emit socket events and handle their responses while integrating with React Query's state management.
 *
 * @template TRequestRoute - The type of socket request route
 * @template TRoute - The type of socket response route
 * @template TError - The type of error that might occur during the mutation
 * @template TData - The type of data returned by the socket response
 * @template TPayload - The type of payload sent in the socket request
 * @template TQueryData - The type of data stored in the React Query cache
 *
 * @param socketRequest - Configuration object for the socket request
 * @param socketResponse - Configuration object for handling the socket response
 * @param options - React Query options for the mutation
 * @param preCallback - Optional callback function executed before the socket request, allowing manipulation of cached data
 * @param callback - Optional callback function executed after receiving the socket response, allowing transformation of the response data
 *
 * @returns A mutation object from React Query that can be used to trigger the socket request
 *
 * @example
 * ```tsx
 * interface Message {
 *   id: string;
 *   content: string;
 *   timestamp: string;
 *   pending?: boolean;
 * }
 *
 * interface SendMessagePayload {
 *   content: string;
 *   chatId: string;
 * }
 *
 * const ChatComponent = () => {
 *   const mutation = useSocketQueryMutation({
 *     emitEvent: 'chat:send',
 *     responseEvent: 'chat:message',
 *     options: {
 *       queryKey: ['chat', 'messages', chatId]
 *     },
 *     // Pre-callback: Optimistically update messages
 *     preCallback: (currentMessages: Message[] | null, variables: SendMessagePayload) => {
 *       const optimisticMessage: Message = {
 *         id: `temp-${Date.now()}`,
 *         content: variables.content,
 *         timestamp: new Date().toISOString(),
 *         pending: true
 *       };
 *       return [...(currentMessages ?? []), optimisticMessage];
 *     },
 *     // Post-callback: Replace optimistic message with server response
 *     callback: (socketResponse: Message, currentMessages: Message[] | null) => {
 *       if (!currentMessages) return [socketResponse];
 *       return currentMessages.map(msg =>
 *         msg.pending ? socketResponse : msg
 *       );
 *     }
 *   });
 *
 *   const handleSendMessage = (content: string) => {
 *     mutation.mutate({
 *       content,
 *       chatId: '123'
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={() => handleSendMessage('Hello!')}
 *         disabled={mutation.isPending}
 *       >
 *         {mutation.isPending ? 'Sending...' : 'Send Message'}
 *       </button>
 *       {mutation.isError && (
 *         <div className="error">
 *           Failed to send message: {mutation.error.message}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSocketQueryMutation<
  TRequestRoute extends BusterSocketRequestRoute,
  TRoute extends BusterSocketResponseRoute,
  TError = unknown,
  TData = InferBusterSocketResponseData<TRoute>,
  TPayload = InferBusterSocketRequestPayload<TRequestRoute>,
  TQueryData = unknown
>({
  emitEvent,
  responseEvent,
  options,
  preCallback,
  callback
}: {
  emitEvent: TRequestRoute;
  responseEvent: TRoute;
  options?:
    | (UseQueryOptions<TQueryData, unknown, TQueryData, QueryKey> & { queryKey?: QueryKey })
    | null;
  preCallback?:
    | ((currentData: TQueryData | null, variables: TPayload) => TQueryData | Promise<TQueryData>)
    | null;
  callback?:
    | ((
        newData: InferBusterSocketResponseData<TRoute>,
        currentData: TQueryData | null,
        variables: TPayload
      ) => TQueryData)
    | null;
}) {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  const mutationFn: MutationFunction<TData, TPayload> = useMemoizedFn(
    async (variables: TPayload): Promise<TData> => {
      const queryKey: QueryKey | undefined = options?.queryKey;

      if (!queryKey) {
        throw new Error('Query key is required');
      }

      if (preCallback) {
        const currentData = queryKey
          ? (queryClient.getQueryData<TQueryData>(queryKey) ?? null)
          : null;
        const transformedData = await preCallback(currentData, variables);
        if (!isEmpty(queryKey) && queryKey) queryClient.setQueryData(queryKey, transformedData);
      }

      try {
        const result = await busterSocket.emitAndOnce({
          emitEvent: {
            route: emitEvent,
            payload: variables as InferBusterSocketRequestPayload<TRequestRoute>
          } as BusterSocketRequest,
          responseEvent: {
            route: responseEvent,
            callback: (d: unknown) => {
              const socketData = d as InferBusterSocketResponseData<TRoute>;
              if (callback) {
                const currentData = queryKey
                  ? (queryClient.getQueryData<TQueryData>(queryKey) ?? null)
                  : null;
                const transformedData = callback(socketData, currentData, variables);
                if (!isEmpty(queryKey)) queryClient.setQueryData(queryKey, transformedData);
                return transformedData;
              }
              return socketData as TData;
            }
          } as BusterSocketResponse
        });

        return result as TData;
      } catch (error) {
        throw new Error(
          `Failed to emit socket event: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  );

  return useMutation<TData, TError, TPayload>({
    mutationFn,
    throwOnError: true
  });
}
