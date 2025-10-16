import { randomUUID } from 'node:crypto';
import type { ModelMessage } from '@buster/ai';
import { z } from 'zod';
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
  } = validated;

  // Use provided chatId or generate new one
  const chatId = providedChatId || randomUUID();
  // Use provided messageId or generate new one
  const messageId = providedMessageId || randomUUID();

  // Load existing conversation or start fresh
  const conversation = await loadConversation(chatId, workingDirectory);
  const existingMessages: ModelMessage[] = conversation
    ? (conversation.modelMessages as ModelMessage[])
    : [];

  // Add user message
  const userMessage: ModelMessage = {
    role: 'user',
    content: prompt,
  };
  const updatedMessages = [...existingMessages, userMessage];

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
}
