import { initLogger, type ModelMessage } from '@buster/ai';
import type { BusterSDK } from '@buster/sdk';
import { z } from 'zod';
import { executeAgent, type ProxyConfig } from '../handlers/agent-handler';
import { processAgentStream } from '../handlers/stream-handler';
import type { AgentMessage } from '../types/agent-messages';
import { getProxyConfig } from '../utils/ai-proxy';
import { readContextFile } from '../utils/context-file';
import { saveModelMessages } from '../utils/conversation-history';
import { getOrCreateSdk } from '../utils/sdk-factory';

/**
 * CLI wrapper for agent messages with unique ID for React keys
 */
export interface CliAgentMessage {
  id: number;
  message: AgentMessage;
}

/**
 * Parameters for running the analytics engineer agent in chat mode
 */
export const ChatServiceParamsSchema = z.object({
  chatId: z.string().uuid().describe('Chat session identifier'),
  messageId: z.string().uuid().optional().describe('Message ID for tracking'),
  workingDirectory: z.string().describe('Working directory path'),
  isInResearchMode: z.boolean().optional().describe('Research mode flag'),
  abortSignal: z.instanceof(AbortSignal).optional().describe('Abort controller signal'),
  prompt: z.string().optional().describe('User prompt (for creating message in database)'),
  messages: z
    .array(z.any())
    .optional()
    .describe('Conversation messages including user message to pass to agent'),
  contextFilePath: z
    .string()
    .optional()
    .describe('Path to context file to include as system message'),
  sdk: z.custom<BusterSDK>().optional().describe('Optional SDK instance for API operations'),
});

export type ChatServiceParams = z.infer<typeof ChatServiceParamsSchema>;

/**
 * Callbacks for chat service events
 */
export interface ChatServiceCallbacks {
  onThinkingStateChange?: (thinking: boolean) => void;
  onMessageUpdate?: (messages: ModelMessage[]) => void;
  onError?: (error: unknown) => void;
  onAbort?: () => void;
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
  const {
    chatId,
    messageId: providedMessageId,
    workingDirectory,
    isInResearchMode,
    abortSignal,
    prompt: userPrompt,
    messages: providedMessages,
    contextFilePath,
    sdk: providedSdk,
  } = validated;
  const { onThinkingStateChange, onMessageUpdate, onError, onAbort } = callbacks;

  // Generate messageId if not provided
  const messageId = providedMessageId || crypto.randomUUID();

  // Initialize Braintrust logger for observability
  // Development: uses .env values (BRAINTRUST_KEY, ENVIRONMENT)
  // Production: uses hard-coded production values
  // Bun sets import.meta.env.PROD to true only in production builds
  const isDev = !import.meta.env.PROD;
  const braintrustApiKey = isDev
    ? process.env.BRAINTRUST_KEY || 'bt-st-KNPNMOdNPNKi1GdwRxMDA3KL71qw7PECV42zBUWSOv1Geovg'
    : 'bt-st-KNPNMOdNPNKi1GdwRxMDA3KL71qw7PECV42zBUWSOv1Geovg';
  const environment = isDev ? process.env.ENVIRONMENT || 'development' : 'production';

  const braintrustLogger = initLogger({
    apiKey: braintrustApiKey,
    projectName: environment,
  });

  try {
    // Use provided messages (caller is responsible for loading conversation and adding user message)
    let previousMessages: ModelMessage[] = (providedMessages as ModelMessage[]) || [];

    // Prepend context file as system message if provided
    if (contextFilePath) {
      const contextContent = readContextFile(contextFilePath, workingDirectory);
      previousMessages = [
        {
          role: 'system',
          content: contextContent,
        },
        ...previousMessages,
      ];
    }

    // Find the index of the last user message (start of current turn)
    // This is where we want to start saving messages (not the full history)
    let currentTurnStartIndex = 0;
    for (let i = previousMessages.length - 1; i >= 0; i--) {
      if (previousMessages[i]?.role === 'user') {
        currentTurnStartIndex = i;
        break;
      }
    }

    // Get proxy configuration
    const proxyConfigRaw = await getProxyConfig();
    const proxyConfig: ProxyConfig = {
      ...proxyConfigRaw,
      modelId: 'anthropic/claude-sonnet-4.5',
    };

    // Use provided SDK or create one (API-first approach)
    // If SDK is not provided, we'll try to create one but don't fail if credentials missing
    let sdk: BusterSDK | null = null;
    if (providedSdk) {
      sdk = providedSdk;
    } else {
      try {
        sdk = await getOrCreateSdk();
      } catch (error) {
        // Log warning but continue - allows CLI to work without credentials
        console.warn('No SDK available - running without API integration:', error);
      }
    }

    // Create message upfront if we have SDK
    if (sdk && messageId) {
      // Create message/chat upfront (upsert pattern)
      // Use provided prompt, or extract from previous messages, or use default
      const prompt =
        userPrompt ||
        (() => {
          const userMessage = previousMessages.find((m) => m.role === 'user');
          return userMessage && typeof userMessage.content === 'string'
            ? userMessage.content
            : null;
        })();

      if (prompt) {
        try {
          await sdk.messages.create(chatId, messageId, {
            prompt,
          });
        } catch (error) {
          // Log but continue - we'll save locally even if API fails
          console.warn('Failed to create message in database:', error);
        }
      }
    }

    // Execute agent and get stream
    const stream = await executeAgent(
      {
        chatId,
        messageId,
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
      onError?: (error: unknown) => void;
      onAbort?: () => void;
      currentTurnStartIndex?: number;
    } = {
      currentTurnStartIndex, // Pass the index to stream handler so it only saves current turn
      onSaveMessages: async (messages) => {
        // Note: messages here are already sliced to current turn by stream handler

        // API-first approach: Only save to disk if SDK is NOT provided
        // When SDK is provided, we ONLY use API (no local file fallback)
        if (!providedSdk) {
          await saveModelMessages(chatId, workingDirectory, messages);
        }

        // Update message in database if we have SDK
        if (sdk && messageId) {
          try {
            await sdk.messages.update(chatId, messageId, {
              rawLlmMessages: messages,
            });
          } catch (error) {
            // When SDK is provided, we should throw errors (no local fallback)
            // When SDK was auto-created, just warn (allows graceful degradation)
            if (providedSdk) {
              throw error;
            } else {
              console.warn('Failed to update message in database:', error);
            }
          }
        }
      },
    };

    if (onMessageUpdate) {
      streamCallbacks.onMessageUpdate = onMessageUpdate;
    }

    if (onThinkingStateChange) {
      streamCallbacks.onThinkingStateChange = onThinkingStateChange;
    }

    if (onError) {
      streamCallbacks.onError = onError;
    }

    if (onAbort) {
      streamCallbacks.onAbort = onAbort;
    }

    await processAgentStream(stream.fullStream, previousMessages, streamCallbacks);

    // Mark message as completed when agent finishes
    if (sdk && messageId) {
      try {
        await sdk.messages.update(chatId, messageId, {
          isCompleted: true,
        });
      } catch (error) {
        console.warn('Failed to mark message as completed:', error);
      }
    }
  } catch (error) {
    // Handle all errors and notify via callback
    console.error('Error in chat agent execution:', error);

    // Notify error callback if provided
    if (onError) {
      onError(error);
    }

    // Re-throw to allow caller to handle as needed
    throw error;
  } finally {
    // Flush Braintrust logger to ensure all traces are sent
    await braintrustLogger.flush();
  }
}
