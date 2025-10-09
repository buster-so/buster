import { randomUUID } from 'node:crypto';
import type { ModelMessage } from '@buster/ai';
import { loadConversation, saveModelMessages } from '../utils/conversation-history';
import { runAnalyticsEngineerAgent } from './analytics-engineer-handler';

export interface RunHeadlessParams {
  prompt: string;
  chatId?: string;
  workingDirectory?: string;
  isInResearchMode?: boolean;
}

/**
 * Runs the analytics engineer agent in headless mode
 * Returns the chatId for resuming the conversation later
 */
export async function runHeadless(params: RunHeadlessParams): Promise<string> {
  const {
    prompt,
    chatId: providedChatId,
    workingDirectory = process.cwd(),
    isInResearchMode,
  } = params;

  // Use provided chatId or generate new one
  const chatId = providedChatId || randomUUID();

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
  await runAnalyticsEngineerAgent({
    chatId,
    workingDirectory,
    ...(isInResearchMode !== undefined && { isInResearchMode }),
    // No callbacks needed in headless mode - messages are saved automatically
  });

  return chatId;
}
