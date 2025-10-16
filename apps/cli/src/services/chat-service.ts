import type { ModelMessage } from '@buster/ai';
import { z } from 'zod';
import { executeAgent, type ProxyConfig } from '../handlers/agent-handler';
import { processAgentStream } from '../handlers/stream-handler';
import { getProxyConfig } from '../utils/ai-proxy';
import { loadConversation, saveModelMessages } from '../utils/conversation-history';

/**
 * CLI wrapper for agent messages with unique ID for React keys
 */
export interface CliAgentMessage {
  id: number;
  message: import('../types/agent-messages').AgentMessage;
}

/**
 * Parameters for running the analytics engineer agent in chat mode
 */
export const ChatServiceParamsSchema = z.object({
  chatId: z.string().uuid().describe('Chat session identifier'),
  workingDirectory: z.string().describe('Working directory path'),
  isInResearchMode: z.boolean().optional().describe('Research mode flag'),
  abortSignal: z.instanceof(AbortSignal).optional().describe('Abort controller signal'),
});

export type ChatServiceParams = z.infer<typeof ChatServiceParamsSchema>;

/**
 * Callbacks for chat service events
 */
export interface ChatServiceCallbacks {
  onThinkingStateChange?: (thinking: boolean) => void;
  onMessageUpdate?: (messages: ModelMessage[]) => void;
}

/**
 * Runs the analytics engineer agent in the CLI without sandbox
 * The agent runs locally but uses the proxy model to route LLM calls through the server
 * Messages are emitted via callback for immediate UI updates and saved to disk for persistence
 */
export async function runChatAgent(
  params: ChatServiceParams,
  callbacks: ChatServiceCallbacks = {}
): Promise<void> {
  const validated = ChatServiceParamsSchema.parse(params);
  const { chatId, workingDirectory, isInResearchMode, abortSignal } = validated;
  const { onThinkingStateChange, onMessageUpdate } = callbacks;

  // Load conversation history to maintain context across sessions
  const conversation = await loadConversation(chatId, workingDirectory);

  // Get the stored model messages (full conversation including tool calls/results)
  const previousMessages: ModelMessage[] = conversation
    ? (conversation.modelMessages as ModelMessage[])
    : [];

  // Get proxy configuration
  const proxyConfigRaw = await getProxyConfig();
  const proxyConfig: ProxyConfig = {
    ...proxyConfigRaw,
    modelId: 'anthropic/claude-sonnet-4.5',
  };

  // Execute agent and get stream
  const stream = await executeAgent(
    {
      chatId,
      workingDirectory,
      userId: 'cli-user',
      organizationId: 'cli',
      dataSourceId: '',
      isInResearchMode,
      abortSignal,
    },
    proxyConfig,
    previousMessages
  );

  // Process the stream and accumulate messages
  const streamCallbacks: {
    onMessageUpdate?: (messages: ModelMessage[]) => void;
    onThinkingStateChange?: (thinking: boolean) => void;
    onSaveMessages: (messages: ModelMessage[]) => Promise<void>;
  } = {
    onSaveMessages: async (messages) => {
      await saveModelMessages(chatId, workingDirectory, messages);
    },
  };

  if (onMessageUpdate) {
    streamCallbacks.onMessageUpdate = onMessageUpdate;
  }

  if (onThinkingStateChange) {
    streamCallbacks.onThinkingStateChange = onThinkingStateChange;
  }

  await processAgentStream(stream.fullStream, previousMessages, streamCallbacks);
}
