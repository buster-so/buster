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

      await tasks.trigger(
        screenshots_task_keys.take_metric_screenshot,
        {
          metricId: id,
          isOnSaveEvent: true,
          supabaseCookieKey: c.get('supabaseCookieKey'),
          supabaseUser: c.get('supabaseUser'),
          accessToken: c.get('accessToken') || '',
          organizationId:
            (await getUserOrganizationId(user.id).then((res) => res?.organizationId)) || '',
        } satisfies TakeMetricScreenshotTrigger,
        {
          idempotencyKey: `take-metric-screenshot-${id}`,
        }
      );

      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;
