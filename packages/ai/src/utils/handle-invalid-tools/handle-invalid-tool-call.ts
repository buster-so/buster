import type { LanguageModelV1FunctionToolCall } from '@ai-sdk/provider';
import { type InvalidToolArgumentsError, NoSuchToolError, type ToolSet } from 'ai';

const handleInvalidToolCall = async <TOOLS extends ToolSet>({
  toolCall,
  tools,
  error,
}: {
  toolCall: LanguageModelV1FunctionToolCall;
  tools: TOOLS;
  error: NoSuchToolError | InvalidToolArgumentsError;
}): Promise<LanguageModelV1FunctionToolCall | null> => {
  if (NoSuchToolError.isInstance(error)) {
    // Get list of available tool names
    const availableTools = Object.keys(tools).join(', ');

    // Return a modified tool call that provides information about available tools
    return {
      ...toolCall,
      args: JSON.stringify({
        message: `That tool isn't available right now, but you can access: ${availableTools}. Please use one of the available tools instead.`,
      }),
    };
  }

  // Handle InvalidToolArgumentsError by providing corrected arguments
  if (error instanceof Error && error.message.includes('Invalid tool arguments')) {
    // Try to create a valid fallback tool call
    try {
      // For invalid arguments, provide a simple fallback structure
      return {
        ...toolCall,
        args: JSON.stringify({
          message: `Invalid arguments provided. Error: ${error.message}. Please retry with valid arguments.`,
          originalArgs: toolCall.args,
          error: error.message,
        }),
      };
    } catch (fallbackError) {
      console.error('Failed to create fallback tool call:', fallbackError);

      // Final fallback - return a basic tool call structure
      return {
        ...toolCall,
        args: JSON.stringify({
          message: 'Tool call failed with invalid arguments. Please retry.',
        }),
      };
    }
  }

  // For any other error types, return a generic error tool call instead of null
  return {
    ...toolCall,
    args: JSON.stringify({
      message: `Tool call error: ${error.message}. Please retry with different parameters.`,
      error: error.message,
    }),
  };
};

export { handleInvalidToolCall };
