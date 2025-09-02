import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { UrlMetadata } from './types';

/**
 * Analyzes URL columns for domain distribution and structural patterns
 */
export class UrlMetadataAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Analyze a URL column to extract domain and structural metadata
   */
  async analyzeUrlColumn(columnName: string): Promise<UrlMetadata> {
    try {
      const results = await Promise.allSettled([
        this.getDomainAnalysis(columnName),
        this.getProtocolAnalysis(columnName),
        this.getStructuralAnalysis(columnName),
        this.getValidationStats(columnName),
      ]);

      const domainAnalysis = results[0].status === 'fulfilled' ? results[0].value : {};
      const protocolAnalysis = results[1].status === 'fulfilled' ? results[1].value : {};
      const structuralAnalysis = results[2].status === 'fulfilled' ? results[2].value : {};
      const validationStats = results[3].status === 'fulfilled' ? results[3].value : undefined;

      const result: UrlMetadata = {
        ...domainAnalysis,
        ...protocolAnalysis,
        ...structuralAnalysis,
      };

      if (validationStats !== undefined) {
        result.validationStats = validationStats;
      }

      return result;
    } catch (error) {
      logger.error(`Failed to analyze URL column ${columnName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  private async getDomainAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const domainSql = `
      WITH url_parsing AS (
        SELECT 
          ${escapedColumn}::VARCHAR as url,
          CASE 
            -- Extract domain from HTTP/HTTPS URLs
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO 'https?://.*'
            THEN REGEXP_EXTRACT(${escapedColumn}::VARCHAR, 'https?://([^/?#]+)', 1)
            ELSE NULL
          END as domain
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      ),
      domain_analysis AS (
        SELECT 
          domain,
          CASE 
            WHEN domain IS NOT NULL AND domain LIKE '%.%'
            THEN REGEXP_EXTRACT(domain, '\.([^.]+)$', 1)
            ELSE NULL
          END as tld
        FROM url_parsing
        WHERE domain IS NOT NULL
      )
      SELECT 
        'domain' as analysis_type,
        domain as value,
        COUNT(*) as count
      FROM domain_analysis
      WHERE domain IS NOT NULL
      GROUP BY domain
      ORDER BY count DESC
      LIMIT 20
      
      UNION ALL
      
      SELECT 
        'tld' as analysis_type,
        tld as value,
        COUNT(*) as count
      FROM domain_analysis
      WHERE tld IS NOT NULL
      GROUP BY tld
      ORDER BY count DESC
      LIMIT 10
    `;

    const results = await this.db.query<{
      analysis_type: string;
      value: string;
      count: number;
    }>(domainSql);

    const domainDistribution: Record<string, number> = {};
    const tldDistribution: Record<string, number> = {};

    for (const result of results) {
      if (result.analysis_type === 'domain') {
        domainDistribution[result.value] = result.count;
      } else if (result.analysis_type === 'tld') {
        tldDistribution[result.value] = result.count;
      }
    }

    return {
      domainDistribution:
        Object.keys(domainDistribution).length > 0 ? domainDistribution : undefined,
      topLevelDomainDistribution:
        Object.keys(tldDistribution).length > 0 ? tldDistribution : undefined,
    };
  }

  private async getProtocolAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const protocolSql = `
      WITH protocol_analysis AS (
        SELECT 
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE 'https://%' THEN 'https'
            WHEN ${escapedColumn}::VARCHAR LIKE 'http://%' THEN 'http'
            WHEN ${escapedColumn}::VARCHAR LIKE 'ftp://%' THEN 'ftp'
            WHEN ${escapedColumn}::VARCHAR LIKE 'ftps://%' THEN 'ftps'
            WHEN ${escapedColumn}::VARCHAR LIKE 'file://%' THEN 'file'
            WHEN ${escapedColumn}::VARCHAR LIKE '%://%' THEN 'other'
            ELSE 'none'
          END as protocol
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      )
      SELECT 
        protocol,
        COUNT(*) as count
      FROM protocol_analysis
      GROUP BY protocol
      ORDER BY count DESC
    `;

    const results = await this.db.query<{
      protocol: string;
      count: number;
    }>(protocolSql);

    const protocolDistribution: Record<string, number> = {};

    for (const result of results) {
      if (result.protocol !== 'none') {
        protocolDistribution[result.protocol] = result.count;
      }
    }

    return {
      protocolDistribution:
        Object.keys(protocolDistribution).length > 0 ? protocolDistribution : undefined,
    };
  }

  private async getStructuralAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const structuralSql = `
      WITH structural_analysis AS (
        SELECT 
          ${escapedColumn}::VARCHAR as url,
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE '%?%' THEN true
            ELSE false
          END as has_query_params,
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE '%#%' THEN true
            ELSE false
          END as has_fragments,
          CASE 
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO 'https?://[^/]+(/[^?#]*)'
            THEN (LENGTH(${escapedColumn}::VARCHAR) - LENGTH(REPLACE(REGEXP_EXTRACT(${escapedColumn}::VARCHAR, 'https?://[^/]+(/[^?#]*)', 1), '/', '')))
            ELSE 0
          END as path_depth
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      )
      SELECT 
        AVG(CASE WHEN has_query_params THEN 1.0 ELSE 0.0 END) as query_param_ratio,
        AVG(CASE WHEN has_fragments THEN 1.0 ELSE 0.0 END) as fragment_ratio,
        AVG(path_depth) as avg_path_depth,
        COUNT(*) as sample_count
      FROM structural_analysis
    `;

    const results = await this.db.query<{
      query_param_ratio: number;
      fragment_ratio: number;
      avg_path_depth: number;
      sample_count: number;
    }>(structuralSql);

    if (results.length > 0) {
      const result = results[0];
      if (!result) {
        return {};
      }
      return {
        hasQueryParams: result.query_param_ratio > 0.1,
        hasFragments: result.fragment_ratio > 0.1,
        avgPathDepth: Math.round(result.avg_path_depth * 100) / 100,
      };
    }

    return {};
  }

  private async getValidationStats(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const validationSql = `
      WITH validation_analysis AS (
        SELECT 
          ${escapedColumn}::VARCHAR as url,
          CASE 
            -- Valid URL pattern (simplified)
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO 'https?://[A-Za-z0-9][A-Za-z0-9.-]*[A-Za-z0-9]/.*'
              OR ${escapedColumn}::VARCHAR SIMILAR TO 'https?://[A-Za-z0-9][A-Za-z0-9.-]*[A-Za-z0-9]/?'
            THEN 'valid'
            -- Malformed URLs (missing protocol, invalid characters, etc.)
            WHEN ${escapedColumn}::VARCHAR LIKE '%.%'
              AND (${escapedColumn}::VARCHAR NOT LIKE '%://%')
            THEN 'missing_protocol'
            WHEN ${escapedColumn}::VARCHAR LIKE '%://%'
              AND ${escapedColumn}::VARCHAR NOT SIMILAR TO 'https?://.*'
            THEN 'invalid_protocol'
            WHEN ${escapedColumn}::VARCHAR LIKE '% %'
            THEN 'contains_spaces'
            ELSE 'invalid'
          END as validation_status
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      )
      SELECT 
        validation_status,
        COUNT(*) as count
      FROM validation_analysis
      GROUP BY validation_status
    `;

    const results = await this.db.query<{
      validation_status: string;
      count: number;
    }>(validationSql);

    if (results.length === 0) return undefined;

    const validUrls = results.find((r) => r.validation_status === 'valid')?.count || 0;
    const invalidUrls = results
      .filter((r) => r.validation_status !== 'valid' && r.validation_status !== 'missing_protocol')
      .reduce((sum, r) => sum + r.count, 0);
    const malformedUrls = results
      .filter((r) =>
        ['missing_protocol', 'invalid_protocol', 'contains_spaces'].includes(r.validation_status)
      )
      .reduce((sum, r) => sum + r.count, 0);

    return {
      validUrls,
      invalidUrls,
      malformedUrls,
    };
  }

  /**
   * Batch analyze URL columns
   */
  async batchAnalyzeUrlColumns(columns: string[]): Promise<Map<string, UrlMetadata>> {
    logger.log('Analyzing URL columns', { columnCount: columns.length });

    const results = new Map<string, UrlMetadata>();

    // Process columns in parallel
    const promises = columns.map(async (column) => {
      try {
        const metadata = await this.analyzeUrlColumn(column);
        results.set(column, metadata);
      } catch (error) {
        logger.error(`Failed to analyze URL column ${column}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        results.set(column, {});
      }
    });

    await Promise.all(promises);

    logger.log('URL analysis completed', { columnsProcessed: columns.length });
    return results;
  }
}
