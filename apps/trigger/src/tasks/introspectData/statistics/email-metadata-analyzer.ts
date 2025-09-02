import { logger } from '@trigger.dev/sdk';
import type { DuckDBManager } from './duckdb-manager';
import type { EmailMetadata } from './types';

/**
 * Analyzes email columns for domain distribution and validation patterns
 */
export class EmailMetadataAnalyzer {
  constructor(private db: DuckDBManager) {}

  /**
   * Analyze an email column to extract domain and validation metadata
   */
  async analyzeEmailColumn(columnName: string): Promise<EmailMetadata> {
    try {
      const results = await Promise.allSettled([
        this.getDomainAnalysis(columnName),
        this.getBusinessPersonalAnalysis(columnName),
        this.getValidationAnalysis(columnName),
        this.getLocalPartAnalysis(columnName),
      ]);

      const domainAnalysis = results[0].status === 'fulfilled' ? results[0].value : {};
      const businessPersonal = results[1].status === 'fulfilled' ? results[1].value : {};
      const validation = results[2].status === 'fulfilled' ? results[2].value : undefined;
      const localPart = results[3].status === 'fulfilled' ? results[3].value : undefined;

      const result: EmailMetadata = {
        ...domainAnalysis,
        ...businessPersonal,
      };

      if (validation !== undefined) {
        result.validationStats = validation;
      }

      if (localPart !== undefined) {
        result.localPartPatterns = localPart;
      }

      return result;
    } catch (error) {
      logger.error(`Failed to analyze email column ${columnName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return {};
    }
  }

  private async getDomainAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const domainSql = `
      WITH email_parsing AS (
        SELECT 
          ${escapedColumn}::VARCHAR as email,
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE '%@%'
            THEN LOWER(TRIM(SUBSTRING(${escapedColumn}::VARCHAR FROM POSITION('@' IN ${escapedColumn}::VARCHAR) + 1)))
            ELSE NULL
          END as domain
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::VARCHAR LIKE '%@%'
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
        FROM email_parsing
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

  private async getBusinessPersonalAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    // Common personal email domains
    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'me.com',
      'live.com',
      'msn.com',
      'yahoo.co.uk',
      'googlemail.com',
      'protonmail.com',
      'tutanota.com',
    ];

    const businessPersonalSql = `
      WITH email_classification AS (
        SELECT 
          ${escapedColumn}::VARCHAR as email,
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE '%@%'
            THEN LOWER(TRIM(SUBSTRING(${escapedColumn}::VARCHAR FROM POSITION('@' IN ${escapedColumn}::VARCHAR) + 1)))
            ELSE NULL
          END as domain,
          CASE 
            WHEN LOWER(TRIM(SUBSTRING(${escapedColumn}::VARCHAR FROM POSITION('@' IN ${escapedColumn}::VARCHAR) + 1))) IN (${personalDomains.map((d) => `'${d}'`).join(', ')})
            THEN 'personal'
            WHEN ${escapedColumn}::VARCHAR LIKE '%@%'
            THEN 'business'
            ELSE 'unknown'
          END as email_type
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::VARCHAR LIKE '%@%'
        LIMIT 1000
      )
      SELECT 
        email_type,
        COUNT(*) as count
      FROM email_classification
      WHERE email_type IN ('personal', 'business')
      GROUP BY email_type
    `;

    const results = await this.db.query<{
      email_type: string;
      count: number;
    }>(businessPersonalSql);

    const businessEmails = results.find((r) => r.email_type === 'business')?.count || 0;
    const personalEmails = results.find((r) => r.email_type === 'personal')?.count || 0;

    return {
      businessEmails: businessEmails > 0 ? businessEmails : undefined,
      personalEmails: personalEmails > 0 ? personalEmails : undefined,
    };
  }

  private async getValidationAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const validationSql = `
      WITH email_validation AS (
        SELECT 
          ${escapedColumn}::VARCHAR as email,
          CASE 
            -- Basic email pattern validation
            WHEN ${escapedColumn}::VARCHAR SIMILAR TO '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
            THEN 'valid'
            -- Common issues
            WHEN ${escapedColumn}::VARCHAR NOT LIKE '%@%'
            THEN 'missing_at'
            WHEN ${escapedColumn}::VARCHAR LIKE '%@%' AND ${escapedColumn}::VARCHAR NOT LIKE '%.%'
            THEN 'missing_domain'
            WHEN ${escapedColumn}::VARCHAR LIKE '%@@%' OR ${escapedColumn}::VARCHAR LIKE '@%' OR ${escapedColumn}::VARCHAR LIKE '%@'
            THEN 'malformed_at'
            WHEN ${escapedColumn}::VARCHAR LIKE '% %'
            THEN 'contains_spaces'
            ELSE 'invalid'
          END as validation_status,
          CASE 
            -- Check for disposable email indicators (common patterns)
            WHEN LOWER(TRIM(SUBSTRING(${escapedColumn}::VARCHAR FROM POSITION('@' IN ${escapedColumn}::VARCHAR) + 1))) 
              IN ('10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org', 'throwaway.email')
            THEN true
            ELSE false
          END as is_disposable
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
        LIMIT 1000
      )
      SELECT 
        validation_status,
        COUNT(*) as count,
        SUM(CASE WHEN is_disposable THEN 1 ELSE 0 END) as disposable_count
      FROM email_validation
      GROUP BY validation_status
    `;

    const results = await this.db.query<{
      validation_status: string;
      count: number;
      disposable_count: number;
    }>(validationSql);

    if (results.length === 0) return undefined;

    const validFormat = results.find((r) => r.validation_status === 'valid')?.count || 0;
    const invalidFormat = results
      .filter((r) => r.validation_status !== 'valid')
      .reduce((sum, r) => sum + r.count, 0);
    const disposableEmails = results.reduce((sum, r) => sum + r.disposable_count, 0);

    const result: NonNullable<EmailMetadata['validationStats']> = {
      validFormat,
      invalidFormat,
    };

    if (disposableEmails > 0) {
      result.disposableEmails = disposableEmails;
    }

    return result;
  }

  private async getLocalPartAnalysis(columnName: string) {
    const escapedColumn = `"${columnName}"`;

    const localPartSql = `
      WITH local_part_analysis AS (
        SELECT 
          ${escapedColumn}::VARCHAR as email,
          CASE 
            WHEN ${escapedColumn}::VARCHAR LIKE '%@%'
            THEN LOWER(TRIM(SUBSTRING(${escapedColumn}::VARCHAR FROM 1 FOR POSITION('@' IN ${escapedColumn}::VARCHAR) - 1)))
            ELSE NULL
          END as local_part
        FROM ${this.db.getTableName()}
        WHERE ${escapedColumn} IS NOT NULL
          AND ${escapedColumn}::VARCHAR LIKE '%@%'
        LIMIT 1000
      ),
      pattern_detection AS (
        SELECT 
          local_part,
          CASE 
            WHEN local_part SIMILAR TO '[a-z]+\.[a-z]+' THEN 'firstname.lastname'
            WHEN local_part SIMILAR TO '[a-z]+[0-9]+' THEN 'name_with_numbers'
            WHEN local_part SIMILAR TO '[a-z]+_[a-z]+' THEN 'underscore_separated'
            WHEN local_part SIMILAR TO '[a-z]+'  THEN 'single_word'
            WHEN local_part SIMILAR TO '[a-z]+\+[a-z0-9]+' THEN 'plus_addressing'
            ELSE 'other'
          END as pattern_type
        FROM local_part_analysis
        WHERE local_part IS NOT NULL
      )
      SELECT 
        pattern_type as pattern,
        COUNT(*) as frequency
      FROM pattern_detection
      GROUP BY pattern_type
      ORDER BY frequency DESC
      LIMIT 10
    `;

    const results = await this.db.query<{
      pattern: string;
      frequency: number;
    }>(localPartSql);

    return results.length > 0 ? results : undefined;
  }

  /**
   * Batch analyze email columns
   */
  async batchAnalyzeEmailColumns(columns: string[]): Promise<Map<string, EmailMetadata>> {
    logger.log('Analyzing email columns', { columnCount: columns.length });

    const results = new Map<string, EmailMetadata>();

    // Process columns in parallel
    const promises = columns.map(async (column) => {
      try {
        const metadata = await this.analyzeEmailColumn(column);
        results.set(column, metadata);
      } catch (error) {
        logger.error(`Failed to analyze email column ${column}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        results.set(column, {});
      }
    });

    await Promise.all(promises);

    logger.log('Email analysis completed', { columnsProcessed: columns.length });
    return results;
  }
}
