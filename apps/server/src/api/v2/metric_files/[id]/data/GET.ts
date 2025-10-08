import { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import type { TakeMetricScreenshotTrigger } from '@buster-app/trigger/task-schemas';
import { getUserOrganizationId } from '@buster/database/queries';
import { MetricDataParamsSchema, MetricDataQuerySchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { tasks } from '@trigger.dev/sdk';
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

      const organizationId =
        (await getUserOrganizationId(user.id).then((res) => res?.organizationId)) || '';

      await tasks.trigger(
        screenshots_task_keys.take_metric_screenshot,
        {
          metricId: id,
          isOnSaveEvent: false,
          supabaseCookieKey: c.get('supabaseCookieKey'),
          supabaseUser: c.get('supabaseUser'),
          accessToken: c.get('accessToken'),
          organizationId,
        } satisfies TakeMetricScreenshotTrigger,
        { concurrencyKey: `take-metric-screenshot-${id}-${version_number}` }
      );

      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;
