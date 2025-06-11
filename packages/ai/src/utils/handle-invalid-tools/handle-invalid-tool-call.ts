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
  // Handle NoSuchToolError - LLM called a non-existent tool
  if (NoSuchToolError.isInstance(error)) {
    const availableTools = Object.keys(tools).join(', ');
    return {
      ...toolCall,
      args: JSON.stringify({
        message: `That tool isn't available right now, but you can access: ${availableTools}. Please use one of the available tools instead.`,
      }),
    };
  }

  // Handle InvalidToolArgumentsError - LLM provided invalid arguments
  if (error.name === 'AI_InvalidToolArgumentsError') {
    return {
      ...toolCall,
      args: JSON.stringify({
        message: 'Invalid tool arguments, please try again.',
      }),
    };
  }

  // Handle any unmatched error types
  return null;
};

export { handleInvalidToolCall };
