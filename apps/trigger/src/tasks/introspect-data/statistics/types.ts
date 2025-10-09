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

// Dynamic metadata interfaces for specific column types
export interface DateTimeMetadata {
  // Temporal distributions
  yearDistribution?: Record<string, number>;
  monthDistribution?: Record<string, number>;
  quarterDistribution?: Record<string, number>;
  dayOfWeekDistribution?: Record<string, number>;

  // Date range analysis
  minDate?: string;
  maxDate?: string;
  dateRange?: number; // days

  // Recency metrics
  recencyDistribution?: {
    veryRecent: number; // last 7 days
    recent: number; // last 30 days
    moderate: number; // last 90 days
    old: number; // older than 90 days
  };

  // Pattern analysis
  hasTimeComponent?: boolean;
  hasTimezone?: boolean;
  commonFormats?: Array<{ format: string; frequency: number }>;
}

export interface NumericMetadata {
  // Histogram analysis
  histogram?: {
    bins: Array<{ min: number; max: number; count: number; percentage: number }>;
    binCount: number;
    binWidth: number;
  };

  // Scale analysis for wide ranges
  logScaleDistribution?: {
    bins: Array<{ min: number; max: number; count: number; percentage: number }>;
    isLogNormalDistributed: boolean;
  };

  // Value clustering
  clusters?: Array<{
    center: number;
    size: number;
    percentage: number;
  }>;

  // Special numeric patterns
  isInteger?: boolean;
  isMonetary?: boolean;
  isPercentage?: boolean;
  hasNegativeValues?: boolean;
}

export interface IdentifierMetadata {
  // Pattern detection
  patterns?: Array<{
    pattern: string;
    frequency: number;
    example: string;
  }>;

  // Format validation
  formatValidation?: {
    validCount: number;
    invalidCount: number;
    commonErrors?: Array<{ error: string; frequency: number }>;
  };

  // UUID-specific analysis
  uuidAnalysis?: {
    version?: number;
    hasHyphens: boolean;
    isUppercase?: boolean;
    variants?: Record<string, number>;
  };

  // Sequential analysis for IDs
  sequentialAnalysis?: {
    isSequential: boolean;
    gaps?: Array<{ start: number; end: number }>;
    increment?: number;
  };
}

export interface UrlMetadata {
  // Domain analysis
  domainDistribution?: Record<string, number>;
  topLevelDomainDistribution?: Record<string, number>;

  // Protocol analysis
  protocolDistribution?: Record<string, number>;

  // URL structure
  hasQueryParams?: boolean;
  hasFragments?: boolean;
  avgPathDepth?: number;

  // Validation
  validationStats?: {
    validUrls: number;
    invalidUrls: number;
    malformedUrls: number;
  };
}

export interface EmailMetadata {
  // Domain analysis
  domainDistribution?: Record<string, number>;
  topLevelDomainDistribution?: Record<string, number>;

  // Business vs personal email detection
  businessEmails?: number;
  personalEmails?: number;

  // Validation rates
  validationStats?: {
    validFormat: number;
    invalidFormat: number;
    disposableEmails?: number;
  };

  // Local part analysis (before @)
  localPartPatterns?: Array<{
    pattern: string;
    frequency: number;
  }>;
}

export interface JsonMetadata {
  // Schema inference
  inferredSchema?: {
    type: 'object' | 'array' | 'mixed';
    commonKeys?: Array<{ key: string; frequency: number; type: string }>;
    arrayElementTypes?: Record<string, number>;
    maxDepth?: number;
    avgSize?: number;
  };

  // Key analysis for objects
  keyAnalysis?: {
    totalUniqueKeys: number;
    mostCommonKeys: Array<{ key: string; frequency: number }>;
    keyNamingPatterns?: Array<{ pattern: string; frequency: number }>;
  };

  // Validation
  validJsonCount?: number;
  invalidJsonCount?: number;
  parseErrors?: Array<{ error: string; frequency: number }>;
}

// Union type for all dynamic metadata types
export type DynamicMetadata =
  | ({ type: 'datetime' } & DateTimeMetadata)
  | ({ type: 'numeric' } & NumericMetadata)
  | ({ type: 'identifier' } & IdentifierMetadata)
  | ({ type: 'url' } & UrlMetadata)
  | ({ type: 'email' } & EmailMetadata)
  | ({ type: 'json' } & JsonMetadata);

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

  // Dynamic metadata based on detected column type/semantics
  dynamicMetadata?: DynamicMetadata;

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
