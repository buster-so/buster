import type { User } from '@buster/database/queries';
import type { GetDatasetSampleResponse } from '@buster/server-shared';
import { GetDatasetSampleParamsSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { getDatasetSampleHandler } from './get-dataset-sample';

// Create route for GET /v2/datasets/:id/sample
export const GET = new Hono<{
  Variables: {
    busterUser: User;
  };
}>().get('/', zValidator('param', GetDatasetSampleParamsSchema), async (c) => {
  const user = c.get('busterUser');
  const params = c.req.valid('param');

  const response = await getDatasetSampleHandler(params.id, user);

  return c.json<GetDatasetSampleResponse>(response);
});
