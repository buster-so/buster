import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import type { InvalidToolInputError, ModelMessage, NoSuchToolError, ToolSet } from 'ai';
import { repairToolCall } from './repair-tool-call';
import type { AgentContext } from './types';

// Legacy function that now delegates to the new modular repair system
export async function healToolWithLlm({
  toolCall,
  tools,
  error,
  messages = [],
  system,
  inputSchema,
  agentContext,
}: {
  toolCall: LanguageModelV2ToolCall;
  tools: ToolSet;
  error: NoSuchToolError | InvalidToolInputError;
  messages?: ModelMessage[];
  system?: string | ModelMessage | ModelMessage[];
  inputSchema?: (toolCall: LanguageModelV2ToolCall) => unknown;
  agentContext?: AgentContext;
}) {
  return repairToolCall({
    toolCall,
    tools,
    error,
    messages,
    ...(system !== undefined && { system }),
    ...(inputSchema !== undefined && { inputSchema }),
    ...(agentContext !== undefined && { agentContext }),
  });
}
