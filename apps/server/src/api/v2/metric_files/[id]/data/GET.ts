import { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import type { TakeMetricScreenshotTrigger } from '@buster-app/trigger/task-schemas';
import { getUserOrganizationId } from '@buster/database/queries';
import { MetricDataParamsSchema, MetricDataQuerySchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { triggerScreenshotIfNeeded } from '@shared-helpers/screenshots';
import dayjs from 'dayjs';
import { Hono } from 'hono';
import { standardErrorHandler } from '../../../../../utils/response';
import { getMetricDataHandler } from './get-metric-data';

const app = new Hono()
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

      triggerScreenshotIfNeeded<TakeMetricScreenshotTrigger>({
        tag: `take-metric-screenshot-${id}`,
        key: screenshots_task_keys.take_metric_screenshot,
        context: c,
        payload: {
          metricId: id,
          isOnSaveEvent: false,
          accessToken: c.get('accessToken'),
          organizationId:
            (await getUserOrganizationId(user.id).then((res) => res?.organizationId)) || '',
        },
      });

      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;
