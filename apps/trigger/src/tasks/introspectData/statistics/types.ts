/**
 * Types for statistical analysis
 */

export interface TopValue {
  value: unknown;
  count: number;
  percentage: number;
}

export interface NumericStatistics {
  mean: number;
  median: number;
  stdDev: number;
  skewness: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p95: number;
    p99: number;
  };
  outlierRate: number;
}

export interface ColumnClassification {
  isLikelyEnum: boolean;
  isLikelyIdentifier: boolean;
  identifierType?: 'primary_key' | 'foreign_key' | 'natural_key' | 'sequential' | 'uuid_like';
  enumValues?: string[];
}

export interface ColumnRelationships {
  correlations?: Array<{
    column: string;
    strength: number;
    type: 'pearson' | 'cramers_v';
  }>;
  functionalDependencies?: Array<{
    determines: string;
    confidence: number;
  }>;
  mutualInformation?: Array<{
    column: string;
    value: number;
  }>;
}

export interface ColumnProfile {
  // Identification
  columnName: string;
  dataType: string;

  // Basic Statistics
  nullRate: number;
  distinctCount: number;
  uniquenessRatio: number;
  emptyStringRate: number;

  // Distribution
  topValues: TopValue[];
  entropy: number;
  giniCoefficient: number;

  // Sample values
  sampleValues: unknown[];

  // Numeric-specific
  numericStats?: NumericStatistics;

  // Classification
  classification: ColumnClassification;

  // Relationships (optional for now)
  relationships?: ColumnRelationships;
}

export interface TableMetadata {
  sampleSize: number;
  totalRows: number;
  samplingRate: number;
  analysisTimeMs: number;
  confidenceLevel?: number;
  marginOfError?: number;
}

export interface BasicStats {
  nullRate: number;
  distinctCount: number;
  uniquenessRatio: number;
  emptyStringRate: number;
}

export interface DistributionMetrics {
  topValues: TopValue[];
  entropy: number;
  giniCoefficient: number;
}
