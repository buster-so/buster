import type { User } from '@buster/database/queries';
import type { GetMetricResponse } from '@buster/server-shared/metrics';
import { HTTPException } from 'hono/http-exception';
import {
  buildMetricResponse,
  fetchAndProcessMetricData,
} from '../../../../shared-helpers/metric-helpers';

export interface GetMetricHandlerParams {
  metricId: string;
  versionNumber?: number | undefined;
  password?: string | undefined;
}

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
