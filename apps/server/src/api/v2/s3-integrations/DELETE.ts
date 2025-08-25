import type { User } from '@buster/database';
import type { DeleteS3IntegrationResponse } from '@buster/server-shared';
import { Hono } from 'hono';
import { deleteS3IntegrationHandler } from './delete-s3-integration';

const app = new Hono();

export const deleteS3IntegrationRoute = app.delete('/:id', async (c) => {
  const user = c.get('busterUser') as User;
  const id = c.req.param('id');

  const response = await deleteS3IntegrationHandler(user, id);
  return c.json(response as DeleteS3IntegrationResponse);
});

export default app;
