import { getUserByIdWithDatasets } from '@buster/database/queries';
import type { OrganizationUser } from '@buster/server-shared/organization';
import { GetUserByIdRequestSchema } from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../utils/response';

const app = new Hono().get('/', zValidator('param', GetUserByIdRequestSchema), async (c) => {
  const userId = c.req.valid('param').id;

  try {
    const userInfo: OrganizationUser = await getUserByIdWithDatasets(userId);

    return c.json(userInfo);
  } catch (error) {
    console.error(error);
    throw new HTTPException(500, {
      message: 'Error fetching user information',
    });
  }
});

export default app;
