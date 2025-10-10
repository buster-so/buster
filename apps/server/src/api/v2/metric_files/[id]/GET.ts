import type { User } from '@buster/database/queries';
import {
  GetMetricParamsSchema,
  GetMetricQuerySchema,
  type GetMetricResponse,
} from '@buster/server-shared/metrics';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  buildMetricResponse,
  fetchAndProcessMetricData,
} from '../../../../shared-helpers/metric-helpers';
import { standardErrorHandler } from '../../../../utils/response';

interface GetMetricHandlerParams {
  metricId: string;
  versionNumber?: number | undefined;
  password?: string | undefined;
}

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

/**
 * Handler to retrieve a metric by ID with optional version number
 * This is the TypeScript equivalent of the Rust get_metric_handler
 */
export async function getMetricHandler(
  { metricId, ...params }: GetMetricHandlerParams,
  user: User
): Promise<GetMetricResponse> {
  try {
    // Use shared helper to fetch and process metric data
    const processedData = await fetchAndProcessMetricData(metricId, user, {
      publicAccessPreviouslyVerified: false,
      ...params,
    });

    // Build and return the complete metric response
    return await buildMetricResponse(processedData, user.id);
  } catch (error) {
    console.error('Error fetching metric:', error);
    throw new HTTPException(500, { message: 'Failed to fetch metric' });
  }
}
