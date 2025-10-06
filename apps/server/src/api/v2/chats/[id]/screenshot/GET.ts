import { checkPermission } from '@buster/access-controls';
import { getChatById } from '@buster/database/queries';
import {
  GetChatScreenshotParamsSchema,
  GetChatScreenshotQuerySchema,
} from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createImageResponse } from '../../../../../shared-helpers/create-image-response';
import { getChatScreenshotHandler } from './getChatScreenshotHandler';

const app = new Hono().get(
  '/',
  zValidator('param', GetChatScreenshotParamsSchema),
  zValidator('query', GetChatScreenshotQuerySchema),
  async (c) => {
    const chatId = c.req.valid('param').id;
    const search = c.req.valid('query');
    const user = c.get('busterUser');

    const chat = await getChatById(chatId);
    if (!chat) {
      throw new HTTPException(404, { message: 'Metric not found' });
    }

    const permission = await checkPermission({
      userId: user.id,
      assetId: chatId,
      assetType: 'chat',
      requiredRole: 'can_view',
      workspaceSharing: chat.workspaceSharing,
      organizationId: chat.organizationId,
    });

    if (!permission.hasAccess) {
      throw new HTTPException(403, {
        message: 'You do not have permission to view this metric',
      });
    }

    try {
      const screenshotBuffer = await getChatScreenshotHandler({
        params: { id: chatId },
        search,
        context: c,
      });

      return createImageResponse(screenshotBuffer, search.type);
    } catch (error) {
      console.error('Failed to generate chat screenshot URL', {
        chatId,
        error,
      });
      throw new Error('Failed to generate chat screenshot URL');
    }
  }
);

export default app;
