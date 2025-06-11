import { NoSuchToolError, ToolCallRepairError, ToolExecutionError } from 'ai';

/**
 * Handles tool-related errors in onError callbacks for AI SDK streaming
 * Can be used directly as the onError callback function
 */
export const handleInvalidToolError = async (event: { error: unknown }): Promise<void> => {
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

  // Check for InvalidToolArgumentsError using message inspection
  // (since InvalidToolArgumentsError is imported as a type)
  if (error instanceof Error && error.message.includes('Invalid tool arguments')) {
    return; // Let the stream continue, repair mechanism will handle it
  }

  // Check for other tool-related error patterns that should be handled gracefully
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    const isToolRelatedError =
      errorMessage.includes('tool') ||
      errorMessage.includes('schema') ||
      errorMessage.includes('parameter') ||
      errorMessage.includes('argument');

    if (isToolRelatedError) {
      return; // Let the stream continue for tool-related errors
    }
  }

  // For non-tool-related errors, just return to let the stream continue
  return;
};
