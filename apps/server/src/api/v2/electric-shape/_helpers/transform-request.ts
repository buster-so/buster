import type { ChangeMessage, ControlMessage, Message, Row } from '@electric-sql/client';

type ElectricResponseHandlerOptions<
  TInput extends Row<unknown> = never,
  TOutput extends Row<unknown> = TInput,
> = {
  transformCallback?: (message: ChangeMessage<TInput>) => TOutput | Promise<TOutput>;
  operationCallback?: (message: ChangeMessage<TInput>) => void;
  controlCallback?: (message: ControlMessage) => void;
};

/**
 * Transforms Electric SQL response messages with proper typing
 * @param TInput - The input type that will be passed into the function
 * @param TOutput - The output type after transformation has taken place
 */
export async function handleElectricResponse<
  TInput extends Row<unknown> = never,
  TOutput extends Row<unknown> = TInput,
>(
  response: Response,
  options?: ElectricResponseHandlerOptions<TInput, TOutput>
): Promise<Message<TOutput>[]> {
  const messages = (await response.json()) as Message<TInput>[];
  return processElectricMessages(messages, options);
}

/**
 * Processes Electric SQL messages with transformation support
 * @param TInput - The input message type
 * @param TOutput - The output message type after transformation
 */
export async function processElectricMessages<
  TInput extends Row<unknown> = Row,
  TOutput extends Row<unknown> = TInput,
>(
  messages: Message<TInput>[],
  options?: ElectricResponseHandlerOptions<TInput, TOutput>
): Promise<Message<TOutput>[]> {
  const processedMessages: Message<TOutput>[] = [];
  const { transformCallback, operationCallback, controlCallback } = options || {};

  for (const message of messages) {
    if ('operation' in message.headers) {
      const changeMessage = message as ChangeMessage<TInput>;
      operationCallback?.(changeMessage);

      // Apply transformation if callback is provided
      if (transformCallback) {
        const transformedData = await transformCallback(changeMessage);
        // Create a new message with transformed data
        const transformedMessage = {
          ...message,
          value: transformedData,
        } as Message<TOutput>;
        processedMessages.push(transformedMessage);
      } else {
        // No transformation, cast to output type
        processedMessages.push(message as Message<TOutput>);
      }
    } else if ('control' in message.headers) {
      const controlMessage = message as ControlMessage;
      controlCallback?.(controlMessage);
      // Control messages don't need transformation, just cast
      processedMessages.push(message as Message<TOutput>);
    }
  }

  return processedMessages;
}

export async function createElectricHandledResponse<
  TInput extends Row<unknown> = never,
  TOutput extends Row<unknown> = TInput,
>(
  response: Response,
  options?: ElectricResponseHandlerOptions<TInput, TOutput>
): Promise<Response> {
  const transformedData = await handleElectricResponse(response, options);

  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');

  // Return the proxied response
  return new Response(JSON.stringify(transformedData), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export type TransformCallback<
  TInput extends Row<unknown> = never,
  TOutput extends Row<unknown> = TInput,
> = (message: ChangeMessage<TInput>) => TOutput | Promise<TOutput>;
