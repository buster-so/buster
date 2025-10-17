import type { Credentials } from '@buster/data-source';
import { classifyError, createAdapter, DataSourceType, sampleTable } from '@buster/data-source';
import { getDataSourceCredentials, updateDatasetMetadata } from '@buster/database/queries';
import type { DatasetMetadata } from '@buster/database/schema-types';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { BasicStatsAnalyzer } from './statistics/basic-stats';
import { ClassificationAnalyzer } from './statistics/classification';
import { DistributionAnalyzer } from './statistics/distribution';
import { DuckDBManager } from './statistics/duckdb-manager';
import { DynamicMetadataOrchestrator } from './statistics/dynamic-metadata-orchestrator';
import { NumericStatsAnalyzer } from './statistics/numeric-stats';
import { SampleRowsExtractor } from './statistics/sample-rows';
import { SampleValuesExtractor } from './statistics/sample-values';
import type { TopValue } from './statistics/types';
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
  // Machine size is now dynamically provided at trigger time based on table size
  maxDuration: 600, // 10 minutes per table for larger samples
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

      // Generate a unique instance ID for DuckDB to avoid file conflicts
      // Use combination of dataSourceId, table path, and timestamp for uniqueness
      const duckdbInstanceId = `${payload.dataSourceId}_${tableId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      duckdb = new DuckDBManager(duckdbInstanceId);

      // Initialize DuckDB with optimized settings based on sample size
      // Use disk-based storage for very large datasets to optimize memory usage
      const useDisk = sample.sampleSize > 200000 || payload.table.rowCount > 10000000;

      // Calculate memory limit based on sample size
      // Higher memory for larger samples, but use disk for extreme cases
      let memoryLimit: string;
      if (useDisk) {
        // When using disk, we can use less memory
        memoryLimit = '2GB';
      } else if (sample.sampleSize > 100000) {
        memoryLimit = '6GB'; // Need more memory for 100k+ samples
      } else if (sample.sampleSize > 50000) {
        memoryLimit = '4GB';
      } else if (sample.sampleSize > 25000) {
        memoryLimit = '3GB';
      } else {
        memoryLimit = '2GB';
      }

      const duckdbConfig = {
        threads: sample.sampleSize > 50000 ? 8 : sample.sampleSize > 10000 ? 4 : 2,
        memoryLimit,
        useDisk,
      };

      logger.log('Initializing DuckDB with optimized configuration', {
        ...duckdbConfig,
        sampleSize: sample.sampleSize,
        tableRows: payload.table.rowCount,
      });

      // Initialize DuckDB and load sample data
      await duckdb.initialize(duckdbConfig);
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
          totalRows: payload.table.rowCount,
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
      const sampleRowsExtractor = new SampleRowsExtractor(duckdb);
      const dynamicMetadataOrchestrator = new DynamicMetadataOrchestrator(duckdb);

      // Prepare column metadata for batch processing
      const columnMetadata = columns.map((col) => ({
        name: col,
        type: typeMap.get(col) || 'VARCHAR',
      }));

      logger.log('Running batch statistical analysis', { columnCount: columns.length });

      // Run core analyses in parallel for efficiency using allSettled for resilience
      const coreResults = await Promise.allSettled([
        basicAnalyzer.batchComputeBasicStats(columnMetadata),
        distributionAnalyzer.batchComputeDistributions(columns),
        numericAnalyzer.batchComputeNumericStats(columnMetadata),
        classificationAnalyzer.batchClassifyColumns(columns),
        sampleValuesExtractor.batchGetSampleValues(columnMetadata),
        sampleRowsExtractor.getDiverseSampleRows(5), // Get 5 diverse sample rows
      ]);

      // Extract core results with proper error handling
      const basicStats = coreResults[0].status === 'fulfilled' ? coreResults[0].value : new Map();
      const distributions =
        coreResults[1].status === 'fulfilled' ? coreResults[1].value : new Map();
      const numericStats = coreResults[2].status === 'fulfilled' ? coreResults[2].value : new Map();
      const classifications =
        coreResults[3].status === 'fulfilled' ? coreResults[3].value : new Map();
      const sampleValues = coreResults[4].status === 'fulfilled' ? coreResults[4].value : new Map();
      const sampleRows = coreResults[5].status === 'fulfilled' ? coreResults[5].value : [];

      // Log any failures in core analysis
      coreResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const analysisType = [
            'basic stats',
            'distributions',
            'numeric stats',
            'classifications',
            'sample values',
            'sample rows',
          ][index];
          logger.error(`Failed to compute ${analysisType}`, {
            tableId,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      });

      // Prepare metadata for dynamic analysis
      const columnMetadataForDynamic = columns.map((col) => ({
        name: col,
        sqlDataType: typeMap.get(col) || 'VARCHAR',
        sampleValues: sampleValues.get(col) || [],
      }));

      // Run dynamic metadata collection (this analyzes based on detected column types)
      logger.log('Running dynamic metadata analysis', { columnCount: columns.length });
      const dynamicMetadata =
        await dynamicMetadataOrchestrator.collectDynamicMetadata(columnMetadataForDynamic);

      logger.log('Dynamic metadata analysis completed', {
        analyzedColumns: dynamicMetadata.size,
      });

      // Combine results into ColumnProfile objects
      const columnProfiles: ColumnProfile[] = columns.map((col) => {
        const dataType = typeMap.get(col) || 'VARCHAR';
        const basic = basicStats.get(col);
        const distribution = distributions.get(col);
        const numeric = numericStats.get(col);
        const classification = classifications.get(col);
        const samples = sampleValues.get(col);
        const dynamicMeta = dynamicMetadata.get(col);

        const profile: ColumnProfile = {
          columnName: col,
          dataType,

          // Basic statistics
          nullRate: basic?.nullRate ?? 0,
          distinctCount: basic?.distinctCount ?? 0,
          uniquenessRatio: basic?.uniquenessRatio ?? 0,
          emptyStringRate: basic?.emptyStringRate ?? 0,

          // Distribution metrics - properly serialize Date objects in topValues
          topValues: (distribution?.topValues ?? []).map((tv: TopValue) => ({
            ...tv,
            value: tv.value instanceof Date ? tv.value.toISOString() : tv.value,
          })),
          entropy: distribution?.entropy ?? 0,
          giniCoefficient: distribution?.giniCoefficient ?? 0,

          // Sample values - properly serialize Date objects
          sampleValues: (samples ?? []).map((value: unknown) => {
            if (value instanceof Date) {
              return value.toISOString();
            }
            return value;
          }),

          // Classification results
          classification: classification ?? {
            isLikelyEnum: false,
            isLikelyIdentifier: false,
          },
        };

        // Add optional properties only if they have values
        if (numeric) {
          profile.numericStats = {
            // Convert Infinity values to 0 for JSON serialization
            mean: !Number.isFinite(numeric.mean) ? 0 : numeric.mean,
            median: !Number.isFinite(numeric.median) ? 0 : numeric.median,
            stdDev: !Number.isFinite(numeric.stdDev) ? 0 : numeric.stdDev,
            skewness: !Number.isFinite(numeric.skewness) ? 0 : numeric.skewness,
            percentiles: {
              p25: !Number.isFinite(numeric.percentiles.p25) ? 0 : numeric.percentiles.p25,
              p50: !Number.isFinite(numeric.percentiles.p50) ? 0 : numeric.percentiles.p50,
              p75: !Number.isFinite(numeric.percentiles.p75) ? 0 : numeric.percentiles.p75,
              p95: !Number.isFinite(numeric.percentiles.p95) ? 0 : numeric.percentiles.p95,
              p99: !Number.isFinite(numeric.percentiles.p99) ? 0 : numeric.percentiles.p99,
            },
            outlierRate: !Number.isFinite(numeric.outlierRate) ? 0 : numeric.outlierRate,
          };
        }

        if (dynamicMeta) {
          // Cast to unknown first to work around Zod's passthrough type requirements
          profile.dynamicMetadata = dynamicMeta as unknown as ColumnProfile['dynamicMetadata'];
        }

        return profile;
      });

      logger.log('Statistical analysis completed', {
        tableId,
        columnsAnalyzed: columnProfiles.length,
        numericColumns: columnProfiles.filter((p) => p.numericStats).length,
      });

      // Update dataset with metadata
      logger.log('Updating dataset metadata', { tableId });

      const metadata: DatasetMetadata = {
        rowCount: payload.table.rowCount,
        sizeBytes: payload.table.sizeBytes,
        sampleSize: sample.sampleSize,
        samplingMethod: sample.samplingMethod,
        columnProfiles: columnProfiles,
        sampleRows: sampleRows, // Add sample rows to metadata
        introspectedAt: new Date().toISOString(),
      };

      await updateDatasetMetadata({
        dataSourceId: payload.dataSourceId,
        databaseIdentifier: payload.table.database,
        schema: payload.table.schema,
        databaseName: payload.table.database,
        name: payload.table.name,
        metadata,
      });

      logger.log('Dataset metadata updated successfully', { tableId });

      const finalResult = {
        success: true,
        tableId,
        totalRows: payload.table.rowCount,
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
          (_key, value) => {
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
      // Classify the error for better context and retry handling
      const classifiedError = classifyError(error, {
        timeout: 120000, // Default timeout for sampling queries
      });

      logger.error('Table statistics collection failed', {
        tableId,
        dataSourceId: payload.dataSourceId,
        error: classifiedError.message,
        errorCode: classifiedError.code,
        isRetryable: classifiedError.isRetryable,
        originalError: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      // Re-throw the classified error so Trigger.dev can handle retries properly
      // The error will be visible in the Trigger.dev dashboard and the task will be marked as failed
      throw classifiedError;
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
