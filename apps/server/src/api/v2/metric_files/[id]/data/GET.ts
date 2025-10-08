import { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import type { TakeMetricScreenshotTrigger } from '@buster-app/trigger/task-schemas';
import { getUserOrganizationId } from '@buster/database/queries';
import { MetricDataParamsSchema, MetricDataQuerySchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { runs, tasks } from '@trigger.dev/sdk';
import { Hono } from 'hono';
import { id } from 'zod/v4/locales';
import { standardErrorHandler } from '../../../../../utils/response';
import { getMetricDataHandler } from './get-metric-data';

const app = new Hono()
  .get(
    '/',
    zValidator('param', MetricDataParamsSchema),
    zValidator('query', MetricDataQuerySchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const { limit, version_number, report_file_id, password, is_screenshot } =
        c.req.valid('query');
      const user = c.get('busterUser');

      const response = await getMetricDataHandler(
        id,
        user,
        limit,
        version_number,
        report_file_id,
        password
      );

      const tag = `take-metric-screenshot-${id}-${version_number}`;
      const lastTask = await runs
        .list({
          status: ['EXECUTING', 'QUEUED'],
          taskIdentifier: screenshots_task_keys.take_metric_screenshot,
          tag,
          limit: 1,
        })
        .then((res) => res.data[0]);

      if (!lastTask && !is_screenshot) {
        const organizationId =
          (await getUserOrganizationId(user.id).then((res) => res?.organizationId)) || '';
        await tasks.trigger(
          screenshots_task_keys.take_metric_screenshot,
          {
            metricId: id,
            isOnSaveEvent: false,
            accessToken: c.get('accessToken'),
            organizationId,
          } satisfies TakeMetricScreenshotTrigger,
          { tags: [tag] }
        );
      }

      return c.json(response);
    }
  )
  .onError(standardErrorHandler);

export default app;
