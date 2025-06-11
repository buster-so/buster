import {
  APICallError,
  EmptyResponseBodyError,
  InvalidResponseDataError,
  JSONParseError,
  NoContentGeneratedError,
  NoObjectGeneratedError,
  NoSuchToolError,
  RetryError,
  ToolCallRepairError,
  ToolExecutionError,
} from 'ai';

/**
 * Union type of all AI SDK error types that this handler can process
 */
type AISDKError =
  | APICallError
  | EmptyResponseBodyError
  | InvalidResponseDataError
  | JSONParseError
  | NoContentGeneratedError
  | NoObjectGeneratedError
  | NoSuchToolError
  | RetryError
  | ToolCallRepairError
  | ToolExecutionError;

/**
 * Handles tool-related errors in onError callbacks for AI SDK streaming
 * Can be used directly as the onError callback function
 */
export const handleInvalidToolError = async (event: {
  error: AISDKError | Error | unknown;
}): Promise<void> => {
  const error = event.error;

  // Check if this is a NoSuchToolError that experimental_repairToolCall should handle
  if (NoSuchToolError.isInstance(error)) {
    return; // Let the stream continue, repair mechanism will handle it
  }

  // Check if this is a ToolExecutionError
  if (ToolExecutionError.isInstance?.(error)) {
    return; // Let the stream continue for tool execution errors
  }

  // Check if this is a ToolCallRepairError
  if (ToolCallRepairError.isInstance?.(error)) {
    return; // Let the stream continue for tool call repair errors
  }

  // Check for AI SDK specific error types that indicate null/empty responses
  if (EmptyResponseBodyError.isInstance(error)) {
    console.warn('AI SDK EmptyResponseBodyError handled gracefully:', error);
    return; // Let the stream continue
  }

  if (APICallError.isInstance(error)) {
    const errorMessage = error.message || '';
    const requestBody = (error as any).requestBodyValues;

    // Special case: Empty messages array - this is a critical bug, not recoverable
    if (errorMessage.includes('messages: at least one message is required')) {
      console.error('CRITICAL BUG: Empty messages array sent to LLM provider.', {
        error: error.message,
        requestBody: requestBody,
        messagesArray: requestBody?.messages,
        messagesLength: requestBody?.messages?.length,
        hasTools: !!requestBody?.tools,
        toolsCount: requestBody?.tools?.length,
        model: requestBody?.model,
        stackTrace: error.stack,
      });

      throw new Error(
        `Critical message flow bug: No messages provided to LLM. This suggests a problem in conversation history management or message preparation. Check the logs above for request details. Original error: ${errorMessage}`
      );
    }

    console.warn('AI SDK APICallError handled gracefully:', error);
    return; // Let the stream continue
  }

  if (NoContentGeneratedError.isInstance(error)) {
    console.warn('AI SDK NoContentGeneratedError handled gracefully:', error);
    return; // Let the stream continue
  }

  if (NoObjectGeneratedError.isInstance(error)) {
    console.warn('AI SDK NoObjectGeneratedError handled gracefully:', error);
    return; // Let the stream continue
  }

  if (RetryError.isInstance(error)) {
    console.warn('AI SDK RetryError handled gracefully:', error);
    return; // Let the stream continue
  }

  if (JSONParseError.isInstance(error)) {
    console.warn('AI SDK JSONParseError handled gracefully:', error);
    return; // Let the stream continue
  }

  if (InvalidResponseDataError.isInstance(error)) {
    console.warn('AI SDK InvalidResponseDataError handled gracefully:', error);
    return; // Let the stream continue
  }

  // Check for InvalidToolArgumentsError using message inspection as fallback
  // (since InvalidToolArgumentsError is imported as a type)
  if (error instanceof Error && error.message.includes('Invalid tool arguments')) {
    return; // Let the stream continue, repair mechanism will handle it
  }

  // Check for specific error types that might not be Error instances
  if (error === null || error === undefined) {
    console.warn('AI SDK received null/undefined error, continuing stream');
    return;
  }

  // For any other error types, log and continue to avoid breaking the stream
  console.warn('AI SDK unhandled error type, continuing stream:', {
    error,
    type: typeof error,
    constructor: error?.constructor?.name,
  });

  return; // Let the stream continue for any unhandled errors
};
