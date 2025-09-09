import { generateSuggestedMessages } from '@buster/ai';
import {
  getPermissionedDatasets,
  getUserRecentMessages,
  updateUserSuggestedPrompts,
} from '@buster/database';
import {
  GenerateSuggestedPromptsRequestSchema,
  type SuggestedPromptsResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Get database context for a user by fetching their permissioned datasets
 * Returns formatted YAML content from datasets the user has access to
 */
async function getDatabaseContext(userId: string): Promise<string> {
  console.info('[POST SuggestedPrompts] Getting database context for user:', userId);

  try {
    const { datasets } = await getPermissionedDatasets({
      userId,
      pageSize: 1000,
      page: 0,
    });

    if (datasets.length === 0) {
      return '';
    }

    // Filter datasets that have YAML content and format them
    const datasetsWithYaml = datasets
      .filter((dataset) => dataset.ymlContent?.trim())
      .map((dataset) => dataset.ymlContent)
      .join('\n\n---\n\n');

    if (!datasetsWithYaml) {
      return '';
    }

    return datasetsWithYaml;
  } catch (error) {
    console.error('[POST SuggestedPrompts] Error fetching database context:', error);
    return '';
  }
}

/**
 * Format chat history messages into text format for AI processing
 * Takes raw message data and formats as: userMessage: requestMessage, assistantResponses: responseMessages
 */
function formatChatHistoryText(
  messages: Array<{
    requestMessage: string;
    responseMessages: string;
  }>
): string {
  const formattedHistory = messages
    .map((message) => {
      `userMessage: ${message.requestMessage}, assistantResponses: ${message.responseMessages}`;
    })
    .join('\n\n');

  return formattedHistory;
}

/**
 * Get user's chat history formatted as text for AI processing
 * Fetches recent messages and formats them as requested
 */
async function getUserChatHistoryText(userId: string): Promise<string> {
  const recentMessagesCount = 15;
  try {
    const recentMessages = await getUserRecentMessages(userId, recentMessagesCount);

    if (recentMessages.length === 0) {
      return 'No chat history available, please use the database context to generate general suggestions';
    }

    return formatChatHistoryText(recentMessages);
  } catch (error) {
    console.error('[POST SuggestedPrompts] Error fetching chat history:', error);
    return '';
  }
}

const app = new Hono().post(
  '/',
  zValidator('json', GenerateSuggestedPromptsRequestSchema),
  async (c) => {
    try {
      const userId = c.req.param('id');

      const authenticatedUser = c.get('busterUser');

      // Authorization check: Users can only generate suggestions for themselves
      if (authenticatedUser.id !== userId) {
        throw new HTTPException(403, {
          message: 'Forbidden: You can only generate suggested prompts for yourself',
        });
      }
      const [databaseContext, chatHistoryText] = await Promise.all([
        getDatabaseContext(userId),
        getUserChatHistoryText(userId),
      ]);

      if (!databaseContext && !chatHistoryText) {
        throw new HTTPException(400, {
          message: 'No database context or chat history available',
        });
      }

      const generatedPrompts = await generateSuggestedMessages({
        chatHistoryText,
        databaseContext,
        userId,
      });

      const updatedPrompts = await updateUserSuggestedPrompts({
        userId,
        suggestedPrompts: generatedPrompts,
      });

      const response: SuggestedPromptsResponse = {
        suggestedPrompts: updatedPrompts.suggestedPrompts,
        updatedAt: updatedPrompts.updatedAt,
      };

      console.info(
        '[POST SuggestedPrompts] Successfully generated and saved suggestions for user:',
        userId
      );

      return c.json(response);
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error('[POST SuggestedPrompts] Error generating suggestions:', error);
      throw new HTTPException(500, {
        message: 'Error generating suggested prompts',
      });
    }
  }
);

export default app;
