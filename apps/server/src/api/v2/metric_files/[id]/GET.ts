import type { User } from '@buster/database/queries';
import {
  GetMetricParamsSchema,
  GetMetricQuerySchema,
  type GetMetricResponse,
} from '@buster/server-shared/metrics';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../utils/response';
import { getMetricHandler } from './getMetricHandler';

const app = new Hono()
  .get(
    '/',
    zValidator('param', GetMetricParamsSchema),
    zValidator('query', GetMetricQuerySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const { password, version_number } = c.req.valid('query');
      const user = c.get('busterUser');

      console.info(
        `Processing GET request for metric with ID: ${id}, user_id: ${user.id}, version_number: ${version_number}`
      );

      const response: GetMetricResponse = await getMetricHandler(
        {
          metricId: id,
          versionNumber: version_number,
          password,
        },
        user
      );

      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;
