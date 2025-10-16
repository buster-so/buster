import { AccessControlError, ensureDatasetAccess } from '@buster/access-controls';
import type { Credentials } from '@buster/data-source';
import { executeSampleQuery } from '@buster/data-source';
import type { User } from '@buster/database/queries';
import { getDataSourceById, getDataSourceCredentials } from '@buster/database/queries';
import type { GetDatasetSampleResponse } from '@buster/server-shared';
import { ModelSchema } from '@buster/server-shared';
import { HTTPException } from 'hono/http-exception';
import * as yaml from 'yaml';

/**
 * Handler for getting a sample of data from a dataset
 *
 * This handler:
 * 1. Validates the dataset exists and user has access
 * 2. Gets the data source credentials
 * 3. Parses the YAML to determine exposed columns
 * 4. Builds and executes a sample query
 * 5. Returns the sample data
 *
 * @param datasetId - The ID of the dataset to sample
 * @param user - The authenticated user
 * @returns Sample data from the dataset
 */
export async function getDatasetSampleHandler(
  datasetId: string,
  user: User
): Promise<GetDatasetSampleResponse> {
  // Ensure the dataset exists and user has access
  let dataset: Awaited<ReturnType<typeof ensureDatasetAccess>>;
  try {
    dataset = await ensureDatasetAccess({
      userId: user.id,
      datasetId,
    });
  } catch (error) {
    if (error instanceof AccessControlError) {
      if (error.type === 'dataset_not_found') {
        throw new HTTPException(404, {
          message: error.message,
        });
      }
      if (error.type === 'permission_denied') {
        throw new HTTPException(403, {
          message: error.message,
        });
      }
    }
    throw error;
  }

  // Get the data source
  const dataSource = await getDataSourceById(dataset.dataSourceId);

  if (!dataSource) {
    throw new HTTPException(404, {
      message: 'Data source not found for this dataset',
    });
  }

  // Get data source credentials
  let credentials: Credentials;
  try {
    const rawCredentials = await getDataSourceCredentials({
      dataSourceId: dataset.dataSourceId,
    });

    // Ensure credentials have the correct type
    credentials = {
      ...rawCredentials,
      type: dataSource.type,
    } as Credentials;
  } catch (error) {
    console.error('Failed to retrieve data source credentials:', error);
    throw new HTTPException(500, {
      message: 'Failed to access data source',
    });
  }

  // Parse the YAML content to get exposed columns and table info
  let exposedColumns: string[] = [];
  let tableName: string | undefined;
  let schemaName: string | undefined;
  let databaseName: string | undefined;

  if (dataset.ymlFile) {
    try {
      const parsedYaml = yaml.parse(dataset.ymlFile);
      const validated = ModelSchema.safeParse(parsedYaml);

      if (validated.success) {
        const model = validated.data;

        // Get table info from YAML
        tableName = model.name;
        schemaName = model.schema;
        databaseName = model.database;

        // Collect all exposed columns from dimensions and measures
        const dimensionColumns = model.dimensions?.map((d) => d.name) || [];
        const measureColumns = model.measures?.map((m) => m.name) || [];

        exposedColumns = [...dimensionColumns, ...measureColumns];
      } else {
        console.warn('Failed to validate dataset YAML schema:', validated.error);
        // If YAML parsing fails, we'll use SELECT * as fallback
      }
    } catch (error) {
      console.warn('Failed to parse dataset YAML:', error);
      // If YAML parsing fails, we'll use SELECT * as fallback
    }
  }

  // Build the SQL query
  let sql: string;

  // Build the fully qualified table name
  // Priority: YAML values > dataset table values
  const finalTableName = tableName || dataset.databaseName;
  const finalSchemaName = schemaName || dataset.schema;
  const finalDatabaseName = databaseName || dataset.databaseIdentifier;

  // Build the fully qualified name based on what's available
  let fullTableName: string;
  if (finalDatabaseName) {
    // For sources with database (like BigQuery): database.schema.table
    fullTableName = `${finalDatabaseName}.${finalSchemaName}.${finalTableName}`;
  } else {
    // For most sources: schema.table
    fullTableName = `${finalSchemaName}.${finalTableName}`;
  }

  if (exposedColumns.length > 0) {
    // Validate column names to prevent SQL injection
    const validColumnPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    const validColumns = exposedColumns.filter((col) => validColumnPattern.test(col));

    if (validColumns.length === 0) {
      throw new HTTPException(400, {
        message: 'No valid columns found in dataset configuration',
      });
    }

    // Build SELECT with specific columns
    const columnList = validColumns.map((col) => `"${col}"`).join(', ');
    sql = `SELECT ${columnList} FROM ${fullTableName} LIMIT 50`;
  } else {
    // Fallback to SELECT * if no columns are specified
    sql = `SELECT * FROM ${fullTableName} LIMIT 50`;
  }

  // Execute the sample query
  try {
    const result = await executeSampleQuery(dataset.dataSourceId, sql, credentials, {
      limit: 50,
      timeout: 30000, // 30 second timeout for samples
    });

    // Return the data in the expected format
    return result.data;
  } catch (error) {
    console.error('Failed to execute sample query:', error);

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('SELECT statements are allowed')) {
        throw new HTTPException(400, {
          message: 'Invalid query generated for dataset sample',
        });
      }
      if (error.message.includes('timeout')) {
        throw new HTTPException(504, {
          message: 'Query timeout - dataset may be too large or complex',
        });
      }
    }

    throw new HTTPException(500, {
      message: 'Failed to retrieve dataset sample',
    });
  }
}
