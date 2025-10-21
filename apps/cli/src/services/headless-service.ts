import { randomUUID } from 'node:crypto';
import type { ModelMessage } from '@buster/ai';
import { z } from 'zod';
import { readContextFile } from '../utils/context-file';
import { loadConversation, saveModelMessages } from '../utils/conversation-history';
import { runChatAgent } from './chat-service';

/**
 * Parameters for running the agent in headless mode
 */
export const HeadlessServiceParamsSchema = z.object({
  prompt: z.string().min(1).describe('User prompt to send to the agent'),
  chatId: z.string().uuid().optional().describe('Existing chat session ID to resume'),
  messageId: z.string().uuid().optional().describe('Message ID for tracking'),
  workingDirectory: z.string().default(process.cwd()).describe('Working directory path'),
  isInResearchMode: z.boolean().optional().describe('Research mode flag'),
  contextFilePath: z
    .string()
    .optional()
    .describe('Path to context file to include as system message'),
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
  } = validated;

  // Use provided chatId or generate new one
  const chatId = providedChatId || randomUUID();
  // Use provided messageId or generate new one
  const messageId = providedMessageId || randomUUID();

  try {
    // Load existing conversation or start fresh
    const conversation = await loadConversation(chatId, workingDirectory);
    const existingMessages: ModelMessage[] = conversation
      ? (conversation.modelMessages as ModelMessage[])
      : [];

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

    // Save messages with user message
    await saveModelMessages(chatId, workingDirectory, updatedMessages);

    // Run agent with silent callbacks
    await runChatAgent({
      chatId,
      messageId,
      workingDirectory,
      isInResearchMode,
      prompt, // Pass prompt for database message creation
      messages: updatedMessages, // Pass all messages including new user message
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
