import { logger } from '@trigger.dev/sdk';
import type { ColumnSemanticType, ColumnTypeInfo } from './column-type-detector';
import { ColumnTypeDetector } from './column-type-detector';
import { DateTimeMetadataAnalyzer } from './datetime-metadata-analyzer';
import type { DuckDBManager } from './duckdb-manager';
import { EmailMetadataAnalyzer } from './email-metadata-analyzer';
import { IdentifierMetadataAnalyzer } from './identifier-metadata-analyzer';
import { JsonMetadataAnalyzer } from './json-metadata-analyzer';
import { NumericMetadataAnalyzer } from './numeric-metadata-analyzer';
import type { DynamicMetadata } from './types';
import { UrlMetadataAnalyzer } from './url-metadata-analyzer';

/**
 * Column metadata with type information for orchestration
 */
export interface ColumnMetadataInfo {
  name: string;
  sqlDataType: string;
  sampleValues: unknown[];
  semanticType?: ColumnSemanticType;
  confidence?: number;
}

/**
 * Orchestrates dynamic metadata collection based on detected column types
 */
export class DynamicMetadataOrchestrator {
  private typeDetector: ColumnTypeDetector;
  private dateTimeAnalyzer: DateTimeMetadataAnalyzer;
  private numericAnalyzer: NumericMetadataAnalyzer;
  private identifierAnalyzer: IdentifierMetadataAnalyzer;
  private urlAnalyzer: UrlMetadataAnalyzer;
  private emailAnalyzer: EmailMetadataAnalyzer;
  private jsonAnalyzer: JsonMetadataAnalyzer;

  constructor(db: DuckDBManager) {
    this.typeDetector = new ColumnTypeDetector(db);
    this.dateTimeAnalyzer = new DateTimeMetadataAnalyzer(db);
    this.numericAnalyzer = new NumericMetadataAnalyzer(db);
    this.identifierAnalyzer = new IdentifierMetadataAnalyzer(db);
    this.urlAnalyzer = new UrlMetadataAnalyzer(db);
    this.emailAnalyzer = new EmailMetadataAnalyzer(db);
    this.jsonAnalyzer = new JsonMetadataAnalyzer(db);
  }

  /**
   * Collect dynamic metadata for all provided columns
   */
  async collectDynamicMetadata(
    columns: ColumnMetadataInfo[]
  ): Promise<Map<string, DynamicMetadata>> {
    logger.log('Starting dynamic metadata collection', {
      columnCount: columns.length,
    });

    const results = new Map<string, DynamicMetadata>();

    try {
      // Step 1: Detect semantic types for all columns
      const typeDetectionResults = await this.detectColumnTypes(columns);

      // Step 2: Group columns by semantic type for batch processing
      const columnsByType = this.groupColumnsByType(columns, typeDetectionResults);

      // Step 3: Run specialized analyzers in parallel
      const analysisPromises = [
        this.analyzeDateTimeColumns(columnsByType.datetime || []),
        this.analyzeNumericColumns(columnsByType.numeric || []),
        this.analyzeIdentifierColumns(columnsByType.identifier || []),
        this.analyzeUrlColumns(columnsByType.url || []),
        this.analyzeEmailColumns(columnsByType.email || []),
        this.analyzeJsonColumns(columnsByType.json || []),
      ];

      const analysisResults = await Promise.allSettled(analysisPromises);

      // Step 4: Merge results
      const [
        dateTimeResults,
        numericResults,
        identifierResults,
        urlResults,
        emailResults,
        jsonResults,
      ] = analysisResults.map((result) =>
        result.status === 'fulfilled' ? result.value : new Map<string, DynamicMetadata>()
      );

      // Combine all results with proper typing
      this.mergeResults(results, dateTimeResults as Map<string, DynamicMetadata>, 'datetime');
      this.mergeResults(results, numericResults as Map<string, DynamicMetadata>, 'numeric');
      this.mergeResults(results, identifierResults as Map<string, DynamicMetadata>, 'identifier');
      this.mergeResults(results, urlResults as Map<string, DynamicMetadata>, 'url');
      this.mergeResults(results, emailResults as Map<string, DynamicMetadata>, 'email');
      this.mergeResults(results, jsonResults as Map<string, DynamicMetadata>, 'json');

      logger.log('Dynamic metadata collection completed', {
        totalColumns: columns.length,
        analyzedColumns: results.size,
        typeDistribution: this.getTypeDistribution(typeDetectionResults),
      });

      return results;
    } catch (error) {
      logger.error('Failed to collect dynamic metadata', {
        error: error instanceof Error ? error.message : String(error),
      });
      return results; // Return partial results on error
    }
  }

  private async detectColumnTypes(
    columns: ColumnMetadataInfo[]
  ): Promise<Map<string, ColumnTypeInfo>> {
    logger.log('Detecting column semantic types');

    const columnsForDetection = columns.map((col) => ({
      name: col.name,
      type: col.sqlDataType,
      sampleValues: col.sampleValues,
    }));

    return await this.typeDetector.batchDetectColumnTypes(columnsForDetection);
  }

  private groupColumnsByType(
    columns: ColumnMetadataInfo[],
    typeDetectionResults: Map<string, ColumnTypeInfo>
  ): Record<ColumnSemanticType, string[]> {
    const groups: Record<ColumnSemanticType, string[]> = {
      datetime: [],
      numeric: [],
      identifier: [],
      url: [],
      email: [],
      json: [],
      text: [],
      unknown: [],
    };

    for (const column of columns) {
      const typeInfo = typeDetectionResults.get(column.name);
      const semanticType = typeInfo?.semanticType || 'unknown';

      // Only analyze columns with high confidence or explicit type detection
      const confidence = typeInfo?.confidence || 0;
      if (confidence >= 0.3 || ['datetime', 'numeric'].includes(semanticType)) {
        groups[semanticType].push(column.name);
      }
    }

    logger.log('Columns grouped by semantic type', {
      datetime: groups.datetime.length,
      numeric: groups.numeric.length,
      identifier: groups.identifier.length,
      url: groups.url.length,
      email: groups.email.length,
      json: groups.json.length,
      text: groups.text.length,
      unknown: groups.unknown.length,
    });

    return groups;
  }

  private async analyzeDateTimeColumns(columns: string[]) {
    if (columns.length === 0) return new Map();

    logger.log('Analyzing datetime columns', { count: columns.length });
    return await this.dateTimeAnalyzer.batchAnalyzeDateTimeColumns(columns);
  }

  private async analyzeNumericColumns(columns: string[]) {
    if (columns.length === 0) return new Map();

    logger.log('Analyzing numeric columns', { count: columns.length });
    return await this.numericAnalyzer.batchAnalyzeNumericColumns(columns);
  }

  private async analyzeIdentifierColumns(columns: string[]) {
    if (columns.length === 0) return new Map();

    logger.log('Analyzing identifier columns', { count: columns.length });
    return await this.identifierAnalyzer.batchAnalyzeIdentifierColumns(columns);
  }

  private async analyzeUrlColumns(columns: string[]) {
    if (columns.length === 0) return new Map();

    logger.log('Analyzing URL columns', { count: columns.length });
    return await this.urlAnalyzer.batchAnalyzeUrlColumns(columns);
  }

  private async analyzeEmailColumns(columns: string[]) {
    if (columns.length === 0) return new Map();

    logger.log('Analyzing email columns', { count: columns.length });
    return await this.emailAnalyzer.batchAnalyzeEmailColumns(columns);
  }

  private async analyzeJsonColumns(columns: string[]) {
    if (columns.length === 0) return new Map();

    logger.log('Analyzing JSON columns', { count: columns.length });
    return await this.jsonAnalyzer.batchAnalyzeJsonColumns(columns);
  }

  private mergeResults<T>(
    target: Map<string, DynamicMetadata>,
    source: Map<string, T>,
    metadataType: DynamicMetadata['type']
  ): void {
    for (const [columnName, metadata] of source.entries()) {
      // Only add metadata if it has meaningful content
      if (this.hasSignificantMetadata(metadata)) {
        target.set(columnName, {
          type: metadataType,
          ...metadata,
        } as DynamicMetadata);
      }
    }
  }

  private hasSignificantMetadata(metadata: unknown): boolean {
    if (!metadata || typeof metadata !== 'object') {
      return false;
    }

    // Check if the metadata object has any non-undefined values
    const values = Object.values(metadata);
    return values.some(
      (value) =>
        value !== undefined &&
        value !== null &&
        (typeof value !== 'object' || Object.keys(value).length > 0)
    );
  }

  private getTypeDistribution(
    typeDetectionResults: Map<string, ColumnTypeInfo>
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const typeInfo of typeDetectionResults.values()) {
      const type = typeInfo.semanticType;
      distribution[type] = (distribution[type] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get detailed type detection results for debugging/logging
   */
  async getTypeDetectionDetails(
    columns: ColumnMetadataInfo[]
  ): Promise<Map<string, ColumnTypeInfo>> {
    return await this.detectColumnTypes(columns);
  }
}
