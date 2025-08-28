import { DataSourceType, createAdapter, sampleTable } from '@buster/data-source';
import type { Credentials } from '@buster/data-source';
import { getDataSourceCredentials } from '@buster/database';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { BasicStatsAnalyzer } from './statistics/basic-stats';
import { ClassificationAnalyzer } from './statistics/classification';
import { DistributionAnalyzer } from './statistics/distribution';
import { DuckDBManager } from './statistics/duckdb-manager';
import { NumericStatsAnalyzer } from './statistics/numeric-stats';
import { SampleValuesExtractor } from './statistics/sample-values';
import {
  type ColumnProfile,
  type GetTableStatisticsInput,
  GetTableStatisticsInputSchema,
  type GetTableStatisticsOutput,
  type TableMetadata,
} from './types';

/**
 * Task for collecting comprehensive table statistics
 *
 * This task:
 * 1. Fetches credentials for the data source
 * 2. Creates a database adapter connection
 * 3. Samples the specified table using dialect-specific methods
 * 4. Performs statistical analysis using DuckDB in-memory
 * 5. Returns comprehensive column profiles and statistics
 *
 * @example
 * ```typescript
 * const result = await getTableStatisticsTask.trigger({
 *   dataSourceId: 'abc-123',
 *   table: {
 *     name: 'users',
 *     schema: 'public',
 *     database: 'mydb',
 *     rowCount: 50000,
 *     type: 'TABLE'
 *   },
 *   sampleSize: 10000
 * });
 * ```
 */
export const getTableStatisticsTask: ReturnType<
  typeof schemaTask<
    'get-table-statistics',
    typeof GetTableStatisticsInputSchema,
    GetTableStatisticsOutput
  >
> = schemaTask({
  id: 'get-table-statistics',
  schema: GetTableStatisticsInputSchema,
  maxDuration: 120, // 2 minutes per table
  run: async (payload: GetTableStatisticsInput): Promise<GetTableStatisticsOutput> => {
    const tableId = `${payload.table.database}.${payload.table.schema}.${payload.table.name}`;

    logger.log('Starting table statistics collection', {
      dataSourceId: payload.dataSourceId,
      tableId,
      rowCount: payload.table.rowCount,
      requestedSampleSize: payload.sampleSize,
    });

    let adapter = null;
    let duckdb: DuckDBManager | null = null;
    function isCredentials(value: unknown): value is Credentials {
      if (!value || typeof value !== 'object') return false;
      const type = (value as { type?: unknown }).type;
      if (typeof type !== 'string') return false;
      return (Object.values(DataSourceType) as string[]).includes(type);
    }

    try {
      // Step 1: Fetch credentials from vault
      logger.log('Fetching credentials for data source', { dataSourceId: payload.dataSourceId });
      const credentials = await getDataSourceCredentials({ dataSourceId: payload.dataSourceId });
      if (!isCredentials(credentials)) {
        throw new Error('Invalid credentials returned from vault');
      }

      // Step 2: Create adapter
      logger.log('Creating database adapter', { type: credentials.type });
      adapter = await createAdapter(credentials);

      // Step 3: Convert input table to TableMetadata format
      const tableMetadata: TableMetadata = {
        name: payload.table.name,
        schema: payload.table.schema,
        database: payload.table.database,
        rowCount: payload.table.rowCount,
        sizeBytes: payload.table.sizeBytes,
        type: payload.table.type,
      };

      // Step 4: Sample the table
      logger.log('Sampling table', {
        tableId,
        sampleSize: payload.sampleSize,
      });

      const sample = await sampleTable(
        adapter,
        credentials.type,
        tableMetadata,
        payload.sampleSize
      );

      logger.log('Table sampling completed', {
        tableId,
        actualSamples: sample.sampleSize,
        samplingMethod: sample.samplingMethod,
      });

      // Step 5: Statistical analysis using DuckDB
      logger.log('Starting statistical analysis', { tableId });

      duckdb = new DuckDBManager();

      // Initialize DuckDB and load sample data
      await duckdb.initialize();
      await duckdb.loadSampleData(sample);

      // Get column information from the sample
      const columns =
        sample.sampleData.length > 0 && sample.sampleData[0]
          ? Object.keys(sample.sampleData[0])
          : [];

      if (columns.length === 0) {
        logger.warn('No columns found in sample data');
        return {
          success: true,
          tableId,
          sampleSize: payload.sampleSize,
          actualSamples: sample.sampleSize,
          samplingMethod: sample.samplingMethod,
          columnProfiles: [],
        };
      }

      // Get column types from DuckDB
      const columnTypesQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'sample_data'
        `;
      const columnTypes = await duckdb.query<{ column_name: string; data_type: string }>(
        columnTypesQuery
      );
      const typeMap = new Map(columnTypes.map((ct) => [ct.column_name, ct.data_type]));

      // Initialize analyzers
      const basicAnalyzer = new BasicStatsAnalyzer(duckdb);
      const distributionAnalyzer = new DistributionAnalyzer(duckdb);
      const numericAnalyzer = new NumericStatsAnalyzer(duckdb);
      const classificationAnalyzer = new ClassificationAnalyzer(duckdb);
      const sampleValuesExtractor = new SampleValuesExtractor(duckdb);

      // Prepare column metadata for batch processing
      const columnMetadata = columns.map((col) => ({
        name: col,
        type: typeMap.get(col) || 'VARCHAR',
      }));

      logger.log('Running batch statistical analysis', { columnCount: columns.length });

      // Run all analyses in parallel for efficiency
      const [basicStats, distributions, numericStats, classifications, sampleValues] =
        await Promise.all([
          basicAnalyzer.batchComputeBasicStats(columnMetadata),
          distributionAnalyzer.batchComputeDistributions(columns),
          numericAnalyzer.batchComputeNumericStats(columnMetadata),
          classificationAnalyzer.batchClassifyColumns(columns),
          sampleValuesExtractor.batchGetSampleValues(columnMetadata),
        ]);

      // Combine results into ColumnProfile objects
      const columnProfiles: ColumnProfile[] = columns.map((col) => {
        const dataType = typeMap.get(col) || 'VARCHAR';
        const basic = basicStats.get(col);
        const distribution = distributions.get(col);
        const numeric = numericStats.get(col);
        const classification = classifications.get(col);
        const samples = sampleValues.get(col);

        return {
          columnName: col,
          dataType,

          // Basic statistics
          nullRate: basic?.nullRate ?? 0,
          distinctCount: basic?.distinctCount ?? 0,
          uniquenessRatio: basic?.uniquenessRatio ?? 0,
          emptyStringRate: basic?.emptyStringRate ?? 0,

          // Distribution metrics
          topValues: distribution?.topValues ?? [],
          entropy: distribution?.entropy ?? 0,
          giniCoefficient: distribution?.giniCoefficient ?? 0,

          // Sample values
          sampleValues: samples ?? [],

          // Classification
          classification: {
            isLikelyEnum: classification?.isLikelyEnum ?? false,
            isLikelyIdentifier: classification?.isLikelyIdentifier ?? false,
            identifierType: classification?.identifierType,
            enumValues: classification?.enumValues,
          },

          // Numeric statistics (if applicable)
          numericStats: numeric
            ? {
                mean: numeric.mean,
                median: numeric.median,
                stdDev: numeric.stdDev,
                skewness: numeric.skewness,
                percentiles: numeric.percentiles,
                outlierRate: numeric.outlierRate,
              }
            : undefined,
        };
      });

      logger.log('Statistical analysis completed', {
        tableId,
        columnsAnalyzed: columnProfiles.length,
        identifiersFound: columnProfiles.filter((p) => p.classification.isLikelyIdentifier).length,
        enumsFound: columnProfiles.filter((p) => p.classification.isLikelyEnum).length,
        numericColumns: columnProfiles.filter((p) => p.numericStats).length,
      });

      const finalResult = {
        success: true,
        tableId,
        sampleSize: payload.sampleSize,
        actualSamples: sample.sampleSize,
        samplingMethod: sample.samplingMethod,
        columnProfiles,
      };

      // Log the final statistics output with BigInt handling
      logger.log('Final table statistics output', {
        tableId,
        result: JSON.stringify(
          finalResult,
          (key, value) => {
            // Convert BigInt to string for JSON serialization
            if (typeof value === 'bigint') {
              return value.toString();
            }
            return value;
          },
          2
        ),
      });

      return finalResult;
    } catch (error) {
      logger.error('Table sampling failed', {
        tableId,
        dataSourceId: payload.dataSourceId,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        tableId,
        sampleSize: payload.sampleSize,
        actualSamples: 0,
        samplingMethod: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      // Clean up resources
      const cleanupPromises = [];

      // Clean up DuckDB if initialized
      if (duckdb) {
        cleanupPromises.push(
          duckdb
            .cleanup()
            .then(() => logger.log('DuckDB resources cleaned up'))
            .catch((error) =>
              logger.warn('Failed to cleanup DuckDB', {
                error: error instanceof Error ? error.message : String(error),
              })
            )
        );
      }

      // Clean up adapter connection
      if (adapter) {
        cleanupPromises.push(
          adapter
            .close()
            .then(() => logger.log('Database adapter disconnected'))
            .catch((error) =>
              logger.warn('Failed to disconnect adapter', {
                error: error instanceof Error ? error.message : String(error),
              })
            )
        );
      }

      // Wait for all cleanup operations
      await Promise.all(cleanupPromises);
    }
  },
});
