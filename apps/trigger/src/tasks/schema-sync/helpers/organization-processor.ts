import {
  type Credentials,
  type IntrospectionResult,
  type SchemaIntrospectionService,
  compareSchemaWithYml,
  createIntrospectionService,
  extractColumnsFromYml,
  parseDatasetYml,
} from '@buster/data-source';
import {
  type Dataset,
  type OrganizationWithDataSources,
  getActiveOrganizationsWithDataSources,
  getDatasetsWithYmlContent,
  getDistinctDatabaseSchemas,
  getSecretByName,
} from '@buster/database';
import { logger } from '@trigger.dev/sdk/v3';
import type { OrganizationSyncResult } from '../types';
import { logIntrospectionMetrics } from './monitoring';
import type { SchemaDiscrepancy, SchemaSyncRunWithDiscrepancies } from './types';

/**
 * Result from processing an organization with full run data
 */
export interface OrganizationProcessResult {
  result: OrganizationSyncResult;
  run: SchemaSyncRunWithDiscrepancies;
}

/**
 * Process all active organizations for schema sync
 */
export async function processAllOrganizations(): Promise<OrganizationProcessResult[]> {
  const results: OrganizationProcessResult[] = [];

  try {
    // Get all active organizations with data sources
    const organizations = await getActiveOrganizationsWithDataSources();
    logger.info(`Found ${organizations.length} active organizations to process`);

    // Process each organization
    for (const org of organizations) {
      const processResult = await processOrganization(org);
      results.push(processResult);
    }

    return results;
  } catch (error) {
    logger.error('Failed to fetch organizations', { error });
    throw error;
  }
}

/**
 * Process a single organization's data sources
 */
export async function processOrganization(
  org: OrganizationWithDataSources
): Promise<OrganizationProcessResult> {
  const startTime = Date.now();
  const allDiscrepancies: SchemaDiscrepancy[] = [];
  let dataSourcesChecked = 0;
  let datasetsChecked = 0;

  logger.info(`Processing organization: ${org.organization.name}`, {
    organizationId: org.organization.id,
    dataSourceCount: org.dataSources.length,
  });

  try {
    // Process each data source
    for (const dataSource of org.dataSources) {
      try {
        // Retrieve credentials from vault using data source ID as the secret name
        // This matches how the AI package retrieves credentials
        let credentials: Credentials;
        try {
          const secret = await getSecretByName(dataSource.id);
          if (!secret) {
            logger.error(`Failed to retrieve credentials for data source ${dataSource.name}`, {
              organizationId: org.organization.id,
              dataSourceId: dataSource.id,
              secretName: dataSource.id,
            });
            continue;
          }

          credentials = JSON.parse(secret.secret);
        } catch (error) {
          logger.error(`Failed to retrieve or parse credentials for data source ${dataSource.name}`, {
            organizationId: org.organization.id,
            dataSourceId: dataSource.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          continue;
        }

        const dataSourceDiscrepancies = await processDataSource(
          org.organization.id,
          dataSource.id,
          credentials
        );

        allDiscrepancies.push(...dataSourceDiscrepancies.discrepancies);
        datasetsChecked += dataSourceDiscrepancies.datasetsChecked;
        dataSourcesChecked++;
      } catch (error) {
        logger.error(`Failed to process data source ${dataSource.name}`, {
          organizationId: org.organization.id,
          dataSourceId: dataSource.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue processing other data sources
      }
    }

    // Categorize discrepancies
    const criticalCount = allDiscrepancies.filter((d) => d.severity === 'critical').length;
    const warningCount = allDiscrepancies.filter((d) => d.severity === 'warning').length;

    // Create run result
    const runResult: SchemaSyncRunWithDiscrepancies = {
      id: crypto.randomUUID(),
      organizationId: org.organization.id,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'completed',
      dataSourcesChecked,
      datasetsChecked,
      discrepanciesFound: allDiscrepancies.length,
      criticalCount,
      warningCount,
      discrepancies: allDiscrepancies,
      dataSources: org.dataSources.map((ds) => ds.id),
      durationMs: Date.now() - startTime,
    };

    return {
      result: {
        organizationId: org.organization.id,
        organizationName: org.organization.name,
        success: true,
        dataSourcesChecked,
        datasetsChecked,
        discrepancies: allDiscrepancies.length,
        criticalCount,
        warningCount,
        notificationSent: false, // Will be updated by notification service
      },
      run: runResult,
    };
  } catch (error) {
    logger.error(`Failed to process organization ${org.organization.name}`, {
      organizationId: org.organization.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      result: {
        organizationId: org.organization.id,
        organizationName: org.organization.name,
        success: false,
        dataSourcesChecked,
        datasetsChecked,
        discrepancies: 0,
        criticalCount: 0,
        warningCount: 0,
        notificationSent: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      run: {
        id: crypto.randomUUID(),
        organizationId: org.organization.id,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: 'failed',
        dataSourcesChecked,
        datasetsChecked,
        discrepanciesFound: 0,
        criticalCount: 0,
        warningCount: 0,
        discrepancies: [],
        dataSources: org.dataSources.map((ds) => ds.id),
        durationMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Process a single data source
 */
async function processDataSource(
  organizationId: string,
  dataSourceId: string,
  credentials: Credentials
): Promise<{ discrepancies: SchemaDiscrepancy[]; datasetsChecked: number }> {
  const allDiscrepancies: SchemaDiscrepancy[] = [];
  let datasetsChecked = 0;

  // Get datasets with YML content for this data source
  const datasets = await getDatasetsWithYmlContent({
    organizationId,
    dataSourceId,
  });

  if (datasets.length === 0) {
    logger.info('No datasets with YML content found for data source', {
      organizationId,
      dataSourceId,
    });
    return { discrepancies: [], datasetsChecked: 0 };
  }

  // Group datasets by database/schema for efficient introspection
  const datasetGroups = getDistinctDatabaseSchemas(datasets);

  // Create introspection service
  const introspectionService = createIntrospectionService({
    name: dataSourceId,
    type: credentials.type,
    credentials,
  });

  try {
    // Process each database/schema group
    for (const group of datasetGroups) {
      const groupDiscrepancies = await processDatasetGroup(
        group.databaseSchema.database,
        group.databaseSchema.schema,
        group.datasets,
        introspectionService
      );

      allDiscrepancies.push(...groupDiscrepancies);
      datasetsChecked += group.datasets.length;
    }
  } finally {
    // Always clean up connections
    await introspectionService.close();
  }

  return { discrepancies: allDiscrepancies, datasetsChecked };
}

/**
 * Process a group of datasets that share the same database/schema
 */
async function processDatasetGroup(
  database: string,
  schema: string,
  datasets: Dataset[],
  introspectionService: SchemaIntrospectionService
): Promise<SchemaDiscrepancy[]> {
  const discrepancies: SchemaDiscrepancy[] = [];
  const introspectionStartTime = Date.now();

  // Introspect the database/schema once
  const introspectionResult = await introspectionService.introspectDatabaseSchema(database, schema);

  const introspectionDuration = Date.now() - introspectionStartTime;

  if (introspectionResult.error) {
    logger.error('Failed to introspect database/schema', {
      database,
      schema,
      error: introspectionResult.error,
    });
    return [];
  }

  // Log introspection metrics
  const totalColumns = introspectionResult.tables.reduce(
    (sum, table) => sum + table.columns.length,
    0
  );

  logIntrospectionMetrics(
    'schema-sync', // dataSourceId placeholder
    database,
    schema,
    introspectionResult.tables.length,
    totalColumns,
    introspectionDuration
  );

  // Process each dataset in this group
  for (const dataset of datasets) {
    try {
      const datasetDiscrepancies = await processDataset(dataset, introspectionResult);
      discrepancies.push(...datasetDiscrepancies);
    } catch (error) {
      logger.error(`Failed to process dataset ${dataset.name}`, {
        datasetId: dataset.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return discrepancies;
}

/**
 * Process a single dataset
 */
async function processDataset(
  dataset: Dataset,
  introspectionResult: IntrospectionResult
): Promise<SchemaDiscrepancy[]> {
  const discrepancies: SchemaDiscrepancy[] = [];

  try {
    // Skip if no YML file content
    if (!dataset.ymlFile) {
      logger.warn(`Dataset ${dataset.name} has no YML file content`, {
        datasetId: dataset.id,
      });
      return [];
    }

    // Parse YML content
    const parsedYml = parseDatasetYml(dataset.ymlFile);
    const ymlColumns = extractColumnsFromYml(parsedYml);

    // Find tables referenced in the dataset
    const tableName = parsedYml.name || dataset.name;
    const tableData = introspectionResult.tables.find(
      (t) => t.name.toLowerCase() === tableName.toLowerCase()
    );

    if (!tableData) {
      // Table not found - critical issue
      discrepancies.push({
        type: 'missing_table',
        severity: 'critical',
        datasetId: dataset.id,
        datasetName: dataset.name,
        tableName,
        message: `Table '${tableName}' not found in database`,
      });
      return discrepancies;
    }

    // Compare columns
    logger.info(`Comparing schema for dataset ${dataset.name}`, {
      datasetId: dataset.id,
      tableName: tableData.name,
      ymlColumns: ymlColumns.map(col => ({ name: col.name, type: col.type, source: col.source })),
      tableColumns: tableData.columns.map(col => ({ name: col.name, type: col.type })),
    });

    const columnDiscrepancies = compareSchemaWithYml(tableData.columns, ymlColumns, {
      datasetId: dataset.id,
      datasetName: dataset.name,
      tableName: tableData.name,
    });

    if (columnDiscrepancies.length > 0) {
      logger.warn(`Found ${columnDiscrepancies.length} discrepancies for dataset ${dataset.name}`, {
        datasetId: dataset.id,
        discrepancies: columnDiscrepancies.map(d => ({
          type: d.type,
          severity: d.severity,
          columnName: d.columnName,
          message: d.message,
          details: d.details,
        })),
      });
    } else {
      logger.info(`No discrepancies found for dataset ${dataset.name}`, {
        datasetId: dataset.id,
        tableName: tableData.name,
      });
    }

    discrepancies.push(...columnDiscrepancies);
  } catch (error) {
    logger.error(`Failed to parse YML for dataset ${dataset.name}`, {
      datasetId: dataset.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return discrepancies;
}
