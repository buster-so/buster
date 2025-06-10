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
  return null;
};

export { handleInvalidToolCall };
