import { randomUUID } from 'node:crypto';
import type { ModelMessage } from '@buster/ai';
import type { BusterSDK } from '@buster/sdk';
import { z } from 'zod';
import { loadConversationFromApi } from '../utils/api-conversation';
import { readContextFile } from '../utils/context-file';
import { loadConversation, saveModelMessages } from '../utils/conversation-history';
import { getOrCreateSdk } from '../utils/sdk-factory';
import { getCurrentWorkingDirectory } from '../utils/working-directory';
import { runChatAgent } from './chat-service';

/**
 * Parameters for running the agent in headless mode
 */
export const HeadlessServiceParamsSchema = z.object({
  prompt: z.string().min(1).describe('User prompt to send to the agent'),
  chatId: z.string().uuid().optional().describe('Existing chat session ID to resume'),
  messageId: z.string().uuid().optional().describe('Message ID for tracking'),
  workingDirectory: z
    .string()
    .default(getCurrentWorkingDirectory())
    .describe('Working directory path'),
  isInResearchMode: z.boolean().optional().describe('Research mode flag'),
  contextFilePath: z
    .string()
    .optional()
    .describe('Path to context file to include as system message'),
  sdk: z.custom<BusterSDK>().optional().describe('Optional SDK instance for API operations'),
});

export type HeadlessServiceParams = z.infer<typeof HeadlessServiceParamsSchema>;

/**
 * Runs the analytics engineer agent in headless mode
 * Returns the chatId for resuming the conversation later
 */
export async function runHeadlessAgent(params: HeadlessServiceParams): Promise<string> {
  const validated = HeadlessServiceParamsSchema.parse(params);
  const {
    prompt,
    chatId: providedChatId,
    messageId: providedMessageId,
    workingDirectory,
    isInResearchMode,
    contextFilePath,
    sdk: providedSdk,
  } = validated;

  // Use provided chatId or generate new one
  const chatId = providedChatId || randomUUID();
  // Use provided messageId or generate new one
  const messageId = providedMessageId || randomUUID();

  try {
    // Get or create SDK (API-first approach)
    let sdk: BusterSDK | null = null;
    if (providedSdk) {
      sdk = providedSdk;
    } else {
      try {
        sdk = await getOrCreateSdk();
      } catch (error) {
        console.warn('No SDK available - running without API integration:', error);
      }
    }

    // Load existing conversation from API or local files
    let existingMessages: ModelMessage[] = [];
    if (sdk && providedChatId) {
      // API-first: Load from API when SDK is available and chatId is provided
      const conversation = await loadConversationFromApi(providedChatId, sdk);
      if (conversation) {
        existingMessages = conversation.modelMessages as ModelMessage[];
      }
    } else if (!sdk) {
      // Fallback to local files when SDK is not available
      const conversation = await loadConversation(chatId, workingDirectory);
      existingMessages = conversation ? (conversation.modelMessages as ModelMessage[]) : [];
    }

    // Prepare messages array
    const messages: ModelMessage[] = [];

    // Add context file as system message if provided
    if (contextFilePath) {
      const contextContent = readContextFile(contextFilePath, workingDirectory);
      messages.push({
        role: 'system',
        content: contextContent,
      });
    }

    // Add existing conversation messages
    messages.push(...existingMessages);

    // Add user message
    const userMessage: ModelMessage = {
      role: 'user',
      content: prompt,
    };
    messages.push(userMessage);

    const updatedMessages = messages;

    // API-first: Only save to local files if SDK is NOT provided
    if (!providedSdk) {
      await saveModelMessages(chatId, workingDirectory, updatedMessages);
    }

    // Run agent with SDK
    await runChatAgent({
      chatId,
      messageId,
      workingDirectory,
      isInResearchMode,
      isHeadlessMode: true, // Enable headless mode for git communication rules
      prompt, // Pass prompt for database message creation
      messages: updatedMessages, // Pass all messages including new user message
      sdk: sdk || undefined, // Pass SDK to chat agent
    });

    return chatId;
  } catch (error) {
    // Log error and re-throw with context
    console.error('Error in headless agent execution:', error);
    console.error('Context:', {
      chatId,
      messageId,
      workingDirectory,
      prompt: prompt.slice(0, 100),
    });
    throw error;
  }
}
