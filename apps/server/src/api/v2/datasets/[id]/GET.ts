import { getDatasetWithDataSource, type User } from '@buster/database/queries';
import { type BusterDataset, GetDatasetParamsSchema } from '@buster/server-shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

export const getDatasetRoute = app.get(
  '/',
  zValidator('param', GetDatasetParamsSchema),
  async (c) => {
    try {
      const user = c.get('busterUser');
      const { id: datasetId } = c.req.valid('param');

      const response: BusterDataset = await getDatasetHandler(user, datasetId);
      return c.json(response, 200);
    } catch (error) {
      console.error(error);
      // Re-throw HTTPExceptions as-is
      if (error instanceof HTTPException) {
        throw error;
      }

      // Wrap other errors as 500
      throw new HTTPException(500, {
        message: 'Internal server error',
      });
    }
  }
);

export default app;

async function getDatasetHandler(user: User, datasetId: string): Promise<BusterDataset> {
  try {
    const dataset = await getDatasetWithDataSource({
      datasetId,
      userId: user.id,
    });

    if (!dataset) {
      throw new HTTPException(404, {
        message: 'Dataset not found',
      });
    }

    // Step 2: Format and return response
    return {
      id: dataset.id,
      description: dataset.whenToUse || '',
      name: dataset.name,
      sql: dataset.sql,
      yml_file: dataset.ymlFile || '',
      data_source_name: dataset.dataSourceName,
      data_source_type: dataset.dataSourceType,
      data_source_id: dataset.dataSourceId,
    };
  } catch (error) {
    // Handle permission errors
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        throw new HTTPException(403, {
          message: 'You do not have permission to access this dataset',
        });
      }
      if (error.message.includes('Unable to get user role')) {
        throw new HTTPException(404, {
          message: 'Dataset not found or you do not belong to the organization',
        });
      }
    }

    // Re-throw HTTPExceptions
    if (error instanceof HTTPException) {
      throw error;
    }

    // Log and throw generic error
    console.error('[getDataset] Unexpected error', {
      datasetId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new HTTPException(500, {
      message: 'Failed to get dataset',
    });
  }
}
