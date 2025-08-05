import {
  getChatTitle,
  getCollectionTitle,
  getDashboardTitle,
  getMetricTitle,
  getReportTitle,
  getUserOrganizationId,
} from '@buster/database';
import { GetTitleRequestSchema, type GetTitleResponse } from '@buster/server-shared/title';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { requireAuth } from '../../../middleware/auth';
import { standardErrorHandler } from '../../../utils/response';

const app = new Hono()
  .use('*', requireAuth)
  .get('/', zValidator('query', GetTitleRequestSchema), async (c) => {
    try {
      const { assetId, assetType } = c.req.valid('query');
      const user = c.get('busterUser');

      const userOrg = await getUserOrganizationId(user.id);

      let title: string | null = null;

      switch (assetType) {
        case 'chat':
          title = await getChatTitle({ assetId, organizationId: userOrg?.organizationId });
          break;
        case 'metric':
          title = await getMetricTitle({ assetId, organizationId: userOrg?.organizationId });
          break;
        case 'collection':
          title = await getCollectionTitle({ assetId, organizationId: userOrg?.organizationId });
          break;
        case 'dashboard':
          title = await getDashboardTitle({ assetId, organizationId: userOrg?.organizationId });
          break;
        case 'report':
          title = await getReportTitle({ assetId, organizationId: userOrg?.organizationId });
          break;
        default: {
          const _exhaustive: never = assetType;
          throw new HTTPException(400, { message: `Unsupported asset type: ${assetType}` });
        }
      }

      if (title === null) {
        throw new HTTPException(404, { message: 'Asset not found or access denied' });
      }

      const response: GetTitleResponse = { title };
      return c.json(response);
    } catch (error) {
      return standardErrorHandler(error, c);
    }
  })
  .onError(standardErrorHandler);

export default app;
