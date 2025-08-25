import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import type { InvalidToolInputError, ModelMessage, NoSuchToolError, ToolSet } from 'ai';
import type { ANALYST_AGENT_NAME, DOCS_AGENT_NAME, THINK_AND_PREP_AGENT_NAME } from '../../agents';

export interface AgentContext {
  agentName: typeof ANALYST_AGENT_NAME | typeof THINK_AND_PREP_AGENT_NAME | typeof DOCS_AGENT_NAME;
  availableTools: string[];
  nextPhaseTools?: string[];
}

export interface RepairContext {
  toolCall: LanguageModelV2ToolCall;
  tools: ToolSet;
  error: NoSuchToolError | InvalidToolInputError;
  messages: ModelMessage[];
  system?: string | ModelMessage | ModelMessage[];
  inputSchema?: (toolCall: LanguageModelV2ToolCall) => unknown;
  agentContext?: AgentContext;
}
