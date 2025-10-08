import { MetricDataParamsSchema, MetricDataQuerySchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../../utils/response';
import { saveMetricScreenshotHandler } from '../screenshot/saveMetricScreenshotHandler';
import { getMetricDataHandler } from './get-metric-data';

const app = new Hono()
  // GET /metric_files/:id/data - Get metric data with pagination
  .get(
    '/',
    zValidator('param', MetricDataParamsSchema),
    zValidator('query', MetricDataQuerySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const { limit, version_number, report_file_id, password } = c.req.valid('query');
      const user = c.get('busterUser');

      const response = await getMetricDataHandler(
        id,
        user,
        limit,
        version_number,
        report_file_id,
        password
      );

      saveMetricScreenshotHandler({
        metricId: id,
        version_number,
        isOnSaveEvent: true,
        context: c,
      });

      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;
