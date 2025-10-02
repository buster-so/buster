import { checkPermission } from '@buster/access-controls';
import { getChatById } from '@buster/database/queries';
import {
  AssetIdParamsSchema,
  PutScreenshotRequestSchema,
  type PutScreenshotResponse,
} from '@buster/server-shared/screenshots';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { uploadScreenshotHandler } from '../../../../../shared-helpers/upload-screenshot-handler';

const app = new Hono().put(
  '/',
  zValidator('json', PutScreenshotRequestSchema),
  zValidator('param', AssetIdParamsSchema),
  async (c) => {
    const assetId = c.req.valid('param').id;
    const { base64Image } = c.req.valid('json');
    const user = c.get('busterUser');

    const chat = await getChatById(assetId);
    if (!chat) {
      throw new HTTPException(404, { message: 'Chat not found' });
    }

    const permission = await checkPermission({
      userId: user.id,
      assetId,
      assetType: 'chat',
      requiredRole: 'can_edit',
      workspaceSharing: chat.workspaceSharing,
      organizationId: chat.organizationId,
    });

    if (!permission.hasAccess) {
      throw new HTTPException(403, {
        message: 'You do not have permission to upload a screenshot for this chat',
      });
    }

    const result: PutScreenshotResponse = await uploadScreenshotHandler({
      assetType: 'chat',
      assetId,
      base64Image,
      organizationId: chat.organizationId,
    });

    return c.json(result);
  }
);

export default app;
