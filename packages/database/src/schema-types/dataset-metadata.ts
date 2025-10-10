import { z } from 'zod';

// Dynamic metadata schemas for different column types
const DateTimeMetadataSchema = z.object({
  type: z.literal('datetime'),
  yearDistribution: z.record(z.number()).optional(),
  monthDistribution: z.record(z.number()).optional(),
  quarterDistribution: z.record(z.number()).optional(),
  dayOfWeekDistribution: z.record(z.number()).optional(),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  dateRange: z.number().optional(),
  recencyDistribution: z
    .object({
      veryRecent: z.number(),
      recent: z.number(),
      moderate: z.number(),
      old: z.number(),
    })
    .optional(),
  hasTimeComponent: z.boolean().optional(),
  hasTimezone: z.boolean().optional(),
  commonFormats: z
    .array(
      z.object({
        format: z.string(),
        frequency: z.number(),
      })
    )
    .optional(),
});

const NumericMetadataSchema = z.object({
  type: z.literal('numeric'),
  histogram: z
    .object({
      bins: z.array(
        z.object({
          min: z.number(),
          max: z.number(),
          count: z.number(),
          percentage: z.number(),
        })
      ),
      binCount: z.number(),
      binWidth: z.number(),
    })
    .optional(),
  logScaleDistribution: z
    .object({
      bins: z.array(
        z.object({
          min: z.number(),
          max: z.number(),
          count: z.number(),
          percentage: z.number(),
        })
      ),
      isLogNormalDistributed: z.boolean(),
    })
    .optional(),
  clusters: z
    .array(
      z.object({
        center: z.number(),
        size: z.number(),
        percentage: z.number(),
      })
    )
    .optional(),
  isInteger: z.boolean().optional(),
  isMonetary: z.boolean().optional(),
  isPercentage: z.boolean().optional(),
  hasNegativeValues: z.boolean().optional(),
});

const IdentifierMetadataSchema = z.object({
  type: z.literal('identifier'),
  patterns: z
    .array(
      z.object({
        pattern: z.string(),
        frequency: z.number(),
        example: z.union([z.string(), z.number()]),
      })
    )
    .optional(),
  formatValidation: z
    .object({
      validCount: z.number(),
      invalidCount: z.number(),
      commonErrors: z
        .array(
          z.object({
            error: z.string(),
            frequency: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
  uuidAnalysis: z
    .object({
      version: z.number().optional(),
      hasHyphens: z.boolean(),
      isUppercase: z.boolean().optional(),
      variants: z.record(z.number()).optional(),
    })
    .optional(),
  sequentialAnalysis: z
    .object({
      isSequential: z.boolean(),
      gaps: z
        .array(
          z.object({
            start: z.number(),
            end: z.number(),
          })
        )
        .optional(),
      increment: z.number().optional(),
    })
    .optional(),
});

const UrlMetadataSchema = z.object({
  type: z.literal('url'),
  domainDistribution: z.record(z.number()).optional(),
  topLevelDomainDistribution: z.record(z.number()).optional(),
  protocolDistribution: z.record(z.number()).optional(),
  hasQueryParams: z.boolean().optional(),
  hasFragments: z.boolean().optional(),
  avgPathDepth: z.number().optional(),
  validationStats: z
    .object({
      validUrls: z.number(),
      invalidUrls: z.number(),
      malformedUrls: z.number(),
    })
    .optional(),
});

const EmailMetadataSchema = z.object({
  type: z.literal('email'),
  domainDistribution: z.record(z.number()).optional(),
  topLevelDomainDistribution: z.record(z.number()).optional(),
  businessEmails: z.number().optional(),
  personalEmails: z.number().optional(),
  validationStats: z
    .object({
      validFormat: z.number(),
      invalidFormat: z.number(),
      disposableEmails: z.number().optional(),
    })
    .optional(),
  localPartPatterns: z
    .array(
      z.object({
        pattern: z.string(),
        frequency: z.number(),
      })
    )
    .optional(),
});

const JsonMetadataSchema = z.object({
  type: z.literal('json'),
  inferredSchema: z
    .object({
      type: z.enum(['object', 'array', 'mixed']),
      commonKeys: z
        .array(
          z.object({
            key: z.string(),
            frequency: z.number(),
            type: z.string(),
          })
        )
        .optional(),
      arrayElementTypes: z.record(z.number()).optional(),
      maxDepth: z.number().optional(),
      avgSize: z.number().optional(),
    })
    .optional(),
  keyAnalysis: z
    .object({
      totalUniqueKeys: z.number(),
      mostCommonKeys: z.array(
        z.object({
          key: z.string(),
          frequency: z.number(),
        })
      ),
      keyNamingPatterns: z
        .array(
          z.object({
            pattern: z.string(),
            frequency: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
  validJsonCount: z.number().optional(),
  invalidJsonCount: z.number().optional(),
  parseErrors: z
    .array(
      z.object({
        error: z.string(),
        frequency: z.number(),
      })
    )
    .optional(),
});

// Union schema for dynamic metadata
const DynamicMetadataSchema = z.union([
  DateTimeMetadataSchema,
  NumericMetadataSchema,
  IdentifierMetadataSchema,
  UrlMetadataSchema,
  EmailMetadataSchema,
  JsonMetadataSchema,
]);

// Column profile type (matching the introspection output)
export const DatasetColumnProfileSchema = z.object({
  columnName: z.string(),
  dataType: z.string(),

  // Basic statistics
  nullRate: z.number().min(0).max(1),
  distinctCount: z.number().int().nonnegative(),
  uniquenessRatio: z.number().min(0).max(1),
  emptyStringRate: z.number().min(0).max(1),

  // Distribution
  topValues: z.array(
    z.object({
      value: z.unknown(),
      count: z.number(),
      percentage: z.number(),
    })
  ),
  entropy: z.number(),
  giniCoefficient: z.number().min(0).max(1),

  // Sample values
  sampleValues: z.array(z.unknown()),

  // Numeric statistics (optional)
  numericStats: z
    .object({
      mean: z.number(),
      median: z.number(),
      stdDev: z.number(),
      skewness: z.number(),
      percentiles: z.object({
        p25: z.number(),
        p50: z.number(),
        p75: z.number(),
        p95: z.number(),
        p99: z.number(),
      }),
      outlierRate: z.number().min(0).max(1),
    })
    .optional(),

  // Classification (optional)
  classification: z
    .object({
      isLikelyEnum: z.boolean(),
      isLikelyIdentifier: z.boolean(),
      identifierType: z
        .enum(['primary_key', 'foreign_key', 'natural_key', 'sequential', 'uuid_like'])
        .optional(),
      enumValues: z.array(z.string()).optional(),
    })
    .optional(),

  // Dynamic metadata based on detected column semantics
  dynamicMetadata: DynamicMetadataSchema.optional(),
});

export const DatasetMetadataSchema = z.object({
  rowCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative().optional(),
  sampleSize: z.number().int().nonnegative(),
  samplingMethod: z.string(),
  columnProfiles: z.array(DatasetColumnProfileSchema),
  sampleRows: z.array(z.record(z.unknown())).optional(), // Complete sample rows to show column relationships
  introspectedAt: z.string(), // ISO date string
});

export type DatasetColumnProfile = z.infer<typeof DatasetColumnProfileSchema>;
export type DatasetMetadata = z.infer<typeof DatasetMetadataSchema>;
