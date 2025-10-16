import { randomUUID } from 'node:crypto';
import type { ModelMessage } from '@buster/ai';
import { createAnalyticsEngineerAgent } from '@buster/ai/agents/analytics-engineer-agent/analytics-engineer-agent';
import { createProxyModel } from '@buster/ai/llm/providers/proxy-model';
import type { AgentMessage } from '../types/agent-messages';
import { getProxyConfig } from '../utils/ai-proxy';
import { loadConversation, saveModelMessages } from '../utils/conversation-history';
import {
  addReasoningContent,
  addTextContent,
  addToolCall,
  addToolResult,
  createMessageAccumulatorState,
  type MessageAccumulatorState,
  resetStepState,
} from './message-accumulator';

/**
 * CLI wrapper for agent messages with unique ID for React keys
 */
export interface CliAgentMessage {
  id: number;
  message: AgentMessage;
}

export interface RunAnalyticsEngineerAgentParams {
  chatId: string;
  workingDirectory: string;
  isInResearchMode?: boolean;
  onThinkingStateChange?: (thinking: boolean) => void;
  onMessageUpdate?: (messages: ModelMessage[]) => void;
  abortSignal?: AbortSignal;
}

/**
 * Runs the analytics engineer agent in the CLI without sandbox
 * The agent runs locally but uses the proxy model to route LLM calls through the server
 * Messages are emitted via callback for immediate UI updates and saved to disk for persistence
 */
export async function runAnalyticsEngineerAgent(params: RunAnalyticsEngineerAgentParams) {
  const {
    chatId,
    workingDirectory,
    isInResearchMode,
    onThinkingStateChange,
    onMessageUpdate,
    abortSignal,
  } = params;

  // Load conversation history to maintain context across sessions
  const conversation = await loadConversation(chatId, workingDirectory);

  // Get the stored model messages (full conversation including tool calls/results)
  const previousMessages: ModelMessage[] = conversation
    ? (conversation.modelMessages as ModelMessage[])
    : [];

  // Get proxy configuration
  const proxyConfig = await getProxyConfig();

  // Create proxy model that routes through server
  const proxyModel = createProxyModel({
    baseURL: proxyConfig.baseURL,
    apiKey: proxyConfig.apiKey,
    modelId: 'anthropic/claude-sonnet-4.5',
  });

  // Create the docs agent with proxy model
  // Tools are handled locally, only model calls go through proxy
  const analyticsEngineerAgent = createAnalyticsEngineerAgent({
    folder_structure: process.cwd(), // Use current working directory for CLI mode
    userId: 'cli-user',
    chatId: chatId,
    dataSourceId: '',
    organizationId: 'cli',
    messageId: randomUUID(),
    todosList: [],
    model: proxyModel,
    abortSignal,
    apiKey: proxyConfig.apiKey,
    apiUrl: proxyConfig.baseURL,
    isInResearchMode: isInResearchMode || false,
  });

  // Use conversation history - includes user messages, assistant messages, tool calls, and tool results
  const messages: ModelMessage[] = previousMessages;

  // Start the stream - this triggers the agent to run
  const stream = await analyticsEngineerAgent.stream({ messages });

  // Notify thinking state
  onThinkingStateChange?.(true);

  // Initialize message accumulator state
  let accumulatorState = createMessageAccumulatorState(messages);

  // Track streaming text and reasoning within a step
  let accumulatedText = '';
  let accumulatedReasoning = '';

  // Consume the stream
  for await (const part of stream.fullStream) {
    if (part.type === 'start-step') {
      accumulatedText = '';
      accumulatedReasoning = '';
      accumulatorState = resetStepState(accumulatorState);
    }

    if (part.type === 'reasoning-delta') {
      accumulatedReasoning += part.text;
    }

    if (part.type === 'reasoning-end') {
      if (accumulatedReasoning) {
        accumulatorState = addReasoningContent(accumulatorState, accumulatedReasoning);
        onMessageUpdate?.(accumulatorState.messages);
        await saveModelMessages(chatId, workingDirectory, accumulatorState.messages);
      }
    }

    if (part.type === 'text-delta') {
      accumulatedText += part.text;
    }

    if (part.type === 'text-end') {
      if (accumulatedText) {
        accumulatorState = addTextContent(accumulatorState, accumulatedText);
        onMessageUpdate?.(accumulatorState.messages);
        await saveModelMessages(chatId, workingDirectory, accumulatorState.messages);
      }
    }

    if (part.type === 'tool-call') {
      accumulatorState = addToolCall(accumulatorState, part.toolCallId, part.toolName, part.input);
      onMessageUpdate?.(accumulatorState.messages);
    }

    if (part.type === 'tool-result') {
      accumulatorState = addToolResult(
        accumulatorState,
        part.toolCallId,
        part.toolName,
        part.output as string | Record<string, unknown>
      );
      onMessageUpdate?.(accumulatorState.messages);
    }

    if (part.type === 'finish-step') {
      // Save once at end of step to ensure all tool calls/results are captured atomically
      await saveModelMessages(chatId, workingDirectory, accumulatorState.messages);
    }
  }

  onThinkingStateChange?.(false);
}
