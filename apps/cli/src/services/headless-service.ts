import { randomUUID } from 'node:crypto';
import type { ModelMessage } from '@buster/ai';
import type { BusterSDK } from '@buster/sdk';
import { z } from 'zod';
import { loadConversationFromApi } from '../utils/api-conversation';
import { readContextFile } from '../utils/context-file';
import { loadConversation, saveModelMessages } from '../utils/conversation-history';
import { debugLogger } from '../utils/debug-logger';
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
  checkRunKey: z
    .string()
    .optional()
    .describe(
      'GitHub check run ID along with the owner and repo in the format of "checkRunId@owner/repo"'
    ),
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
    checkRunKey,
  } = validated;

  // Use provided chatId or generate new one
  const chatId = providedChatId || randomUUID();
  // Use provided messageId or generate new one
  const messageId = providedMessageId || randomUUID();

  // Declare SDK outside try block so it's accessible in catch
  let sdk: BusterSDK | null = null;

  try {
    // Get or create SDK (API-first approach)
    if (providedSdk) {
      sdk = providedSdk;
    } else {
      try {
        sdk = await getOrCreateSdk();
      } catch (error) {
        debugLogger.warn('No SDK available - running without API integration:', error);
      }
    }

    let confirmedCheckRunId: number | undefined;
    let checkRunOwner: string | undefined;
    let checkRunRepo: string | undefined;
    if (sdk && checkRunKey) {
      const [checkRunId, repositoryKey] = checkRunKey.split('@');
      if (repositoryKey) {
        const [owner, repo] = repositoryKey.split('/');
        if (owner && repo) {
          checkRunOwner = owner;
          checkRunRepo = repo;
        }
      }
      try {
        const checkRun = await sdk.checkRun.get({
          owner: checkRunOwner ?? '',
          repo: checkRunRepo ?? '',
          check_run_id: Number(checkRunId) ?? 0,
        });
        confirmedCheckRunId = checkRun.id;
      } catch (error) {
        debugLogger.error('Error getting check run. Skipping all check run updates:', error);
      }
    }

    if (sdk && confirmedCheckRunId) {
      await sdk.checkRun.update({
        owner: checkRunOwner ?? '',
        repo: checkRunRepo ?? '',
        check_run_id: confirmedCheckRunId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });
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

    // Run agent with SDK and capture final messages
    const finalMessages = await runChatAgent({
      chatId,
      messageId,
      workingDirectory,
      isInResearchMode,
      isHeadlessMode: true, // Enable headless mode for git communication rules
      prompt, // Pass prompt for database message creation
      messages: updatedMessages, // Pass all messages including new user message
      sdk: sdk || undefined, // Pass SDK to chat agent
    });

    if (sdk && confirmedCheckRunId) {
      // Extract the last assistant message for the check run output
      const outputText = (() => {
        for (let i = finalMessages.length - 1; i >= 0; i--) {
          const message = finalMessages[i];
          if (message && message.role === 'assistant') {
            const contents = message.content;

            // Handle string content
            if (typeof contents === 'string') {
              return contents;
            }

            // Handle array content - find the last text block
            if (Array.isArray(contents)) {
              for (let j = contents.length - 1; j >= 0; j--) {
                const contentPart = contents[j];
                if (
                  contentPart &&
                  typeof contentPart === 'object' &&
                  'type' in contentPart &&
                  contentPart.type === 'text' &&
                  'text' in contentPart &&
                  typeof contentPart.text === 'string'
                ) {
                  return contentPart.text;
                }
              }
            }
          }
        }
        // No assistant message found
        return 'Successfully completed the agent task.';
      })().slice(0, 65535); // GitHub has a 65535 character limit for check run output

      await sdk.checkRun.update({
        owner: checkRunOwner ?? '',
        repo: checkRunRepo ?? '',
        check_run_id: confirmedCheckRunId,
        status: 'completed',
        conclusion: 'success',
        output: {
          title: 'Buster Documentation Agent',
          summary: 'Reviewing Pull Request changes to keep DBT model documentation up to date.',
          text: outputText,
        },
        completed_at: new Date().toISOString(),
      });
    }

    return chatId;
  } catch (error) {
    // Log error and re-throw with context
    debugLogger.error('Error in headless agent execution:', error);
    debugLogger.error('Context:', {
      chatId,
      messageId,
      workingDirectory,
      prompt: prompt.slice(0, 100),
    });

    // Capture error details for database
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Update message with error information if we have SDK
    if (sdk && messageId) {
      try {
        await sdk.messages.update(chatId, messageId, {
          isCompleted: true,
          errorReason: errorMessage,
        });
      } catch (updateError) {
        // When SDK is provided, we should log errors
        // When SDK was auto-created, just warn (allows graceful degradation)
        if (providedSdk) {
          console.error('Failed to save error to database:', updateError);
        } else {
          console.warn('Failed to save error to database:', updateError);
        }
      }
    }

    if (sdk && checkRunKey) {
      try {
        await sdk.checkRun.update({
          owner: checkRunKey.split('@')[1]?.split('/')[0] ?? '',
          repo: checkRunKey.split('@')[1]?.split('/')[1] ?? '',
          check_run_id: Number(checkRunKey.split('@')[0]) ?? 0,
          status: 'completed',
          conclusion: 'failure',
          output: {
            title: 'Buster Documentation Agent',
            summary: 'Buster Documentation Agent failed',
            text: `${errorMessage}`,
          },
          completed_at: new Date().toISOString(),
        });
      } catch (error) {
        debugLogger.error('Error updating check run to failure status:', error);
      }
    }

    throw error;
  }
}
