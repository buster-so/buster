import { listChats } from '@buster/database/queries';
import {
  type GetChatsListRequest,
  GetChatsListRequestSchema,
  type GetChatsListResponseV2,
} from '@buster/server-shared/chats';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createApiKeyAuthMiddleware } from '../../../../middleware/api-key-auth';

const app = new Hono();

/**
 * GET /api/v2/public/chats
 *
 * Fetches paginated list of chats for the authenticated user
 * Requires API key authentication via Bearer token
 *
 * Query parameters:
 * - page_token?: number (default: 0)
 * - page_size?: number (default: 1000)
 *
 * Returns: Paginated list of chat items
 */
app.get(
  '/',
  createApiKeyAuthMiddleware(),
  zValidator('query', GetChatsListRequestSchema),
  async (c) => {
    try {
      // Get the validated API key context
      const apiKey = c.get('apiKey');
      if (!apiKey) {
        throw new HTTPException(401, {
          message: 'Authentication required',
        });
      }

      // Get the validated request data
      const queryParams: GetChatsListRequest = c.req.valid('query');

      // Transform API parameters to database parameters
      // API uses snake_case (chat_type, page_token), database uses camelCase (chatType, page)
      // Public API defaults to 'data_engineer' for CLI usage
      const dbParams = {
        userId: apiKey.ownerId,
        chatType: queryParams.chat_type ?? 'data_engineer',
        page: queryParams.page_token ?? 1,
        page_size: queryParams.page_size ?? 250,
      };

      // Fetch chats from database
      const paginatedChats: GetChatsListResponseV2 = await listChats(dbParams);

      return c.json(paginatedChats);
    } catch (error) {
      // Re-throw HTTPException errors
      if (error instanceof HTTPException) {
        throw error;
      }

      // Handle unexpected errors
      console.error('Error fetching chats:', error);
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

export default app;
