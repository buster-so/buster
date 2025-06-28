import { z } from 'zod/v4';
import { SimplifiedColumnTypeSchema } from './enum';

export const ColumnLabelFormatBaseSchema = z.object({
  style: z.enum(['currency', 'percent', 'number', 'date', 'string']).default('string').optional(),
  columnType: SimplifiedColumnTypeSchema.default('text').optional(),
  // OPTIONAL: if this is not specifically requested by the user, then you should ignore this and the columnId will be used and formatted
  displayName: z.string().default('').optional(),
  // OPTIONAL: default is ','. You should add this style if the column type requires a unique separator style. This will only apply if the format is set to 'number'.
  numberSeparatorStyle: z.nullable(z.literal(',')).default(',').optional(),
  // OPTIONAL: default is 0. This is essentially used to set a minimum number of decimal places. This will only apply if the format is set to 'number'.
  minimumFractionDigits: z
    .number()
    .min(0, 'Minimum fraction digits must be at least 0')
    .max(20, 'Minimum fraction digits must be at most 20')
    .default(0)
    .optional(),
  // OPTIONAL: default is 2. This is essentially used to set a maximum number of decimal places. This will only apply if the format is set to 'number'.
  maximumFractionDigits: z
    .number()
    .min(0, 'Maximum fraction digits must be at least 0')
    .max(20, 'Maximum fraction digits must be at most 20')
    .default(2)
    .optional(),
  // OPTIONAL: default is 1. This will only apply if the format is set to 'number', 'currency', or 'percent'.
  multiplier: z
    .number()
    .min(0.001, 'Multiplier must be at least 0.001')
    .max(1000000, 'Multiplier must be at most 1,000,000')
    .default(1)
    .optional(),
  // OPTIONAL: default is ''. This sets a prefix to go in front of each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  prefix: z.string().default('').optional(),
  // OPTIONAL: default is ''. This sets a suffix to go after each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  suffix: z.string().default('').optional(),
  // OPTIONAL: default is 0. This will only apply if the format is set to 'number'. This will replace missing data with the specified value.
  replaceMissingDataWith: z
    .union([z.literal(0), z.null(), z.string()])
    .default(0)
    .optional(),
  useRelativeTime: z.boolean().default(false).optional(),
  isUTC: z.boolean().default(false).optional(),
  makeLabelHumanReadable: z.boolean().default(true).optional(),
  // DO NOT SHARE WITH LLM
  compactNumbers: z.boolean().default(false).optional()
});

export const BusterChartLabelFormatCurrencySchema = z.object({
  style: z.optional(z.enum(['currency', 'percent', 'number', 'date', 'string'])),
  columnType: z.optional(z.enum(['number', 'text', 'date'] as const)),
  // OPTIONAL: if this is not specifically requested by the user, then you should ignore this and the columnId will be used and formatted
  displayName: z.optional(z.string()),
  // OPTIONAL: default is ','. You should add this style if the column type requires a unique separator style. This will only apply if the format is set to 'number'.
  numberSeparatorStyle: z.optional(z.nullable(z.literal(','))),
  // OPTIONAL: default is 0. This is essentially used to set a minimum number of decimal places. This will only apply if the format is set to 'number'.
  minimumFractionDigits: z.optional(
    z
      .number()
      .check(
        z.gte(0, 'Minimum fraction digits must be at least 0'),
        z.lte(20, 'Minimum fraction digits must be at most 20')
      )
  ),
  // OPTIONAL: default is 2. This is essentially used to set a maximum number of decimal places. This will only apply if the format is set to 'number'.
  maximumFractionDigits: z.optional(
    z
      .number()
      .check(
        z.gte(0, 'Maximum fraction digits must be at least 0'),
        z.lte(20, 'Maximum fraction digits must be at most 20')
      )
  ),
  // OPTIONAL: default is 1. This will only apply if the format is set to 'number', 'currency', or 'percent'.
  multiplier: z.optional(
    z
      .number()
      .check(
        z.gte(0.001, 'Multiplier must be at least 0.001'),
        z.lte(1000000, 'Multiplier must be at most 1,000,000')
      )
  ),
  // OPTIONAL: default is ''. This sets a prefix to go in front of each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  prefix: z.optional(z.string()),
  // OPTIONAL: default is ''. This sets a suffix to go after each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  suffix: z.optional(z.string()),
  // OPTIONAL: default is 0. This will only apply if the format is set to 'number'. This will replace missing data with the specified value.
  replaceMissingDataWith: z.optional(z.union([z.literal(0), z.null(), z.string()])),
  useRelativeTime: z.optional(z.boolean()),
  isUTC: z.optional(z.boolean()),
  makeLabelHumanReadable: z.optional(z.boolean()),
  // DO NOT SHARE WITH LLM
  compactNumbers: z.optional(z.boolean()),
  // OPTIONAL: default is 'USD'. This will only apply if the format is set to 'currency'. It should be the ISO 4217 currency code.
  currency: z.optional(z.string())
});

export const BusterChartLabelFormatDateSchema = z.object({
  style: z.optional(z.enum(['currency', 'percent', 'number', 'date', 'string'])),
  columnType: z.optional(z.enum(['number', 'text', 'date'] as const)),
  // OPTIONAL: if this is not specifically requested by the user, then you should ignore this and the columnId will be used and formatted
  displayName: z.optional(z.string()),
  // OPTIONAL: default is ','. You should add this style if the column type requires a unique separator style. This will only apply if the format is set to 'number'.
  numberSeparatorStyle: z.optional(z.nullable(z.literal(','))),
  // OPTIONAL: default is 0. This is essentially used to set a minimum number of decimal places. This will only apply if the format is set to 'number'.
  minimumFractionDigits: z.optional(
    z
      .number()
      .check(
        z.gte(0, 'Minimum fraction digits must be at least 0'),
        z.lte(20, 'Minimum fraction digits must be at most 20')
      )
  ),
  // OPTIONAL: default is 2. This is essentially used to set a maximum number of decimal places. This will only apply if the format is set to 'number'.
  maximumFractionDigits: z.optional(
    z
      .number()
      .check(
        z.gte(0, 'Maximum fraction digits must be at least 0'),
        z.lte(20, 'Maximum fraction digits must be at most 20')
      )
  ),
  // OPTIONAL: default is 1. This will only apply if the format is set to 'number', 'currency', or 'percent'.
  multiplier: z.optional(
    z
      .number()
      .check(
        z.gte(0.001, 'Multiplier must be at least 0.001'),
        z.lte(1000000, 'Multiplier must be at most 1,000,000')
      )
  ),
  // OPTIONAL: default is ''. This sets a prefix to go in front of each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  prefix: z.optional(z.string()),
  // OPTIONAL: default is ''. This sets a suffix to go after each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  suffix: z.optional(z.string()),
  // OPTIONAL: default is 0. This will only apply if the format is set to 'number'. This will replace missing data with the specified value.
  replaceMissingDataWith: z.optional(z.union([z.literal(0), z.null(), z.string()])),
  useRelativeTime: z.optional(z.boolean()),
  isUTC: z.optional(z.boolean()),
  makeLabelHumanReadable: z.optional(z.boolean()),
  // DO NOT SHARE WITH LLM
  compactNumbers: z.optional(z.boolean()),
  // OPTIONAL: default is 'LL'. This will only apply if the format is set to 'date'. This will convert the date to the specified format. This MUST BE IN dayjs format. If you determine that a column type is a date column, you should specify it's date format here.
  dateFormat: z.optional(z.union([z.literal('auto'), z.string()])),
  // OPTIONAL: default is null. This will only apply if the format is set to 'number'. This will convert the number to a specified date unit. For example, if month_of_year is selected, then the number 0 will be converted to January.
  convertNumberTo: z.optional(
    z.nullable(z.enum(['day_of_week', 'month_of_year', 'quarter', 'number']))
  )
});

export const BusterChartLabelFormatNumberSchema = ColumnLabelFormatBaseSchema;

export const BusterChartLabelFormatStringSchema = ColumnLabelFormatBaseSchema;

export const BusterChartLabelFormatPercentSchema = ColumnLabelFormatBaseSchema;

export const ColumnLabelFormatSchema = z.object({
  style: z.optional(z.enum(['currency', 'percent', 'number', 'date', 'string'])),
  columnType: z.optional(z.enum(['number', 'text', 'date'] as const)),
  // OPTIONAL: if this is not specifically requested by the user, then you should ignore this and the columnId will be used and formatted
  displayName: z.optional(z.string()),
  // OPTIONAL: default is ','. You should add this style if the column type requires a unique separator style. This will only apply if the format is set to 'number'.
  numberSeparatorStyle: z.optional(z.nullable(z.literal(','))),
  // OPTIONAL: default is 0. This is essentially used to set a minimum number of decimal places. This will only apply if the format is set to 'number'.
  minimumFractionDigits: z.optional(
    z
      .number()
      .check(
        z.gte(0, 'Minimum fraction digits must be at least 0'),
        z.lte(20, 'Minimum fraction digits must be at most 20')
      )
  ),
  // OPTIONAL: default is 2. This is essentially used to set a maximum number of decimal places. This will only apply if the format is set to 'number'.
  maximumFractionDigits: z.optional(
    z
      .number()
      .check(
        z.gte(0, 'Maximum fraction digits must be at least 0'),
        z.lte(20, 'Maximum fraction digits must be at most 20')
      )
  ),
  // OPTIONAL: default is 1. This will only apply if the format is set to 'number', 'currency', or 'percent'.
  multiplier: z.optional(
    z
      .number()
      .check(
        z.gte(0.001, 'Multiplier must be at least 0.001'),
        z.lte(1000000, 'Multiplier must be at most 1,000,000')
      )
  ),
  // OPTIONAL: default is ''. This sets a prefix to go in front of each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  prefix: z.optional(z.string()),
  // OPTIONAL: default is ''. This sets a suffix to go after each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  suffix: z.optional(z.string()),
  // OPTIONAL: default is 0. This will only apply if the format is set to 'number'. This will replace missing data with the specified value.
  replaceMissingDataWith: z.optional(z.union([z.literal(0), z.null(), z.string()])),
  useRelativeTime: z.optional(z.boolean()),
  isUTC: z.optional(z.boolean()),
  makeLabelHumanReadable: z.optional(z.boolean()),
  // DO NOT SHARE WITH LLM
  compactNumbers: z.optional(z.boolean()),
  // Currency-specific properties
  // OPTIONAL: default is 'USD'. This will only apply if the format is set to 'currency'. It should be the ISO 4217 currency code.
  currency: z.optional(z.string()),
  // Date-specific properties
  // OPTIONAL: default is 'LL'. This will only apply if the format is set to 'date'. This will convert the date to the specified format. This MUST BE IN dayjs format. If you determine that a column type is a date column, you should specify it's date format here.
  dateFormat: z.optional(z.union([z.literal('auto'), z.string()])),
  // OPTIONAL: default is null. This will only apply if the format is set to 'number'. This will convert the number to a specified date unit. For example, if month_of_year is selected, then the number 0 will be converted to January.
  convertNumberTo: z.optional(
    z.nullable(z.enum(['day_of_week', 'month_of_year', 'quarter', 'number']))
  )
});

export const IColumnLabelFormatSchema = z.object({
  columnType: z.enum(['number', 'text', 'date'] as const),
  style: z.enum(['currency', 'percent', 'number', 'date', 'string']),
  // All other properties from ColumnLabelFormat
  // OPTIONAL: if this is not specifically requested by the user, then you should ignore this and the columnId will be used and formatted
  displayName: z.optional(z.string()),
  // OPTIONAL: default is ','. You should add this style if the column type requires a unique separator style. This will only apply if the format is set to 'number'.
  numberSeparatorStyle: z.optional(z.nullable(z.literal(','))),
  // OPTIONAL: default is 0. This is essentially used to set a minimum number of decimal places. This will only apply if the format is set to 'number'.
  minimumFractionDigits: z.optional(
    z
      .number()
      .check(
        z.gte(0, 'Minimum fraction digits must be at least 0'),
        z.lte(20, 'Minimum fraction digits must be at most 20')
      )
  ),
  // OPTIONAL: default is 2. This is essentially used to set a maximum number of decimal places. This will only apply if the format is set to 'number'.
  maximumFractionDigits: z.optional(
    z
      .number()
      .check(
        z.gte(0, 'Maximum fraction digits must be at least 0'),
        z.lte(20, 'Maximum fraction digits must be at most 20')
      )
  ),
  // OPTIONAL: default is 1. This will only apply if the format is set to 'number', 'currency', or 'percent'.
  multiplier: z.optional(
    z
      .number()
      .check(
        z.gte(0.001, 'Multiplier must be at least 0.001'),
        z.lte(1000000, 'Multiplier must be at most 1,000,000')
      )
  ),
  // OPTIONAL: default is ''. This sets a prefix to go in front of each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  prefix: z.optional(z.string()),
  // OPTIONAL: default is ''. This sets a suffix to go after each value found within the column. This will only apply if the format is set to 'number' or 'percent'.
  suffix: z.optional(z.string()),
  // OPTIONAL: default is 0. This will only apply if the format is set to 'number'. This will replace missing data with the specified value.
  replaceMissingDataWith: z.optional(z.union([z.literal(0), z.null(), z.string()])),
  useRelativeTime: z.optional(z.boolean()),
  isUTC: z.optional(z.boolean()),
  makeLabelHumanReadable: z.optional(z.boolean()),
  // DO NOT SHARE WITH LLM
  compactNumbers: z.optional(z.boolean()),
  // Currency-specific properties
  // OPTIONAL: default is 'USD'. This will only apply if the format is set to 'currency'. It should be the ISO 4217 currency code.
  currency: z.optional(z.string()),
  // Date-specific properties
  // OPTIONAL: default is 'LL'. This will only apply if the format is set to 'date'. This will convert the date to the specified format. This MUST BE IN dayjs format. If you determine that a column type is a date column, you should specify it's date format here.
  dateFormat: z.optional(z.union([z.literal('auto'), z.string()])),
  // OPTIONAL: default is null. This will only apply if the format is set to 'number'. This will convert the number to a specified date unit. For example, if month_of_year is selected, then the number 0 will be converted to January.
  convertNumberTo: z.optional(
    z.nullable(z.enum(['day_of_week', 'month_of_year', 'quarter', 'number']))
  )
});

// Export inferred types
export type ColumnLabelFormatBase = z.infer<typeof ColumnLabelFormatBaseSchema>;
export type BusterChartLabelFormatCurrency = z.infer<typeof BusterChartLabelFormatCurrencySchema>;
export type BusterChartLabelFormatDate = z.infer<typeof BusterChartLabelFormatDateSchema>;
export type BusterChartLabelFormatNumber = z.infer<typeof BusterChartLabelFormatNumberSchema>;
export type BusterChartLabelFormatString = z.infer<typeof BusterChartLabelFormatStringSchema>;
export type BusterChartLabelFormatPercent = z.infer<typeof BusterChartLabelFormatPercentSchema>;
export type ColumnLabelFormat = z.infer<typeof ColumnLabelFormatSchema>;
export type IColumnLabelFormat = z.infer<typeof IColumnLabelFormatSchema>;
