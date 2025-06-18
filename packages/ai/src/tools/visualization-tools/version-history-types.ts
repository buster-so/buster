import { z } from 'zod';

// Base version content schemas (reusing from existing files)
const columnLabelFormatSchema = z.object({
  columnType: z.enum(['number', 'string', 'date']),
  style: z.enum(['currency', 'percent', 'number', 'date', 'string']),
  multiplier: z.number().optional(),
  displayName: z.string().optional(),
  numberSeparatorStyle: z.string().nullable().optional(),
  minimumFractionDigits: z.number().optional(),
  maximumFractionDigits: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  replaceMissingDataWith: z.any().optional(),
  compactNumbers: z.boolean().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  useRelativeTime: z.boolean().optional(),
  isUtc: z.boolean().optional(),
  convertNumberTo: z.enum(['day_of_week', 'month_of_year', 'quarter']).optional(),
});

const baseChartConfigSchema = z.object({
  selectedChartType: z.enum(['bar', 'line', 'scatter', 'pie', 'combo', 'metric', 'table']),
  columnLabelFormats: z.record(columnLabelFormatSchema),
  columnSettings: z.record(z.any()).optional(),
  colors: z.array(z.string()).optional(),
  showLegend: z.boolean().optional(),
  gridLines: z.boolean().optional(),
  showLegendHeadline: z.union([z.boolean(), z.string()]).optional(),
  goalLines: z.array(z.any()).optional(),
  trendlines: z.array(z.any()).optional(),
  disableTooltip: z.boolean().optional(),
  xAxisConfig: z.any().optional(),
  yAxisConfig: z.any().optional(),
  y2AxisConfig: z.any().optional(),
  categoryAxisStyleConfig: z.any().optional(),
});

// Metric-specific chart configs
const metricChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('metric'),
  metricColumnId: z.string(),
  metricValueAggregate: z
    .enum(['sum', 'average', 'median', 'count', 'max', 'min', 'first'])
    .optional(),
  metricHeader: z.any().optional(),
  metricSubHeader: z.any().optional(),
  metricValueLabel: z.string().optional(),
});

// For simplicity, we'll use a union of possible chart configs
const chartConfigSchema = z.union([
  metricChartConfigSchema,
  baseChartConfigSchema, // Covers other chart types
]);

// Metric content schema
const metricContentSchema = z.object({
  sql: z.string(),
  name: z.string(),
  timeFrame: z.string(),
  chartConfig: chartConfigSchema,
  description: z.string(),
});

// Dashboard content schema
const dashboardItemSchema = z.object({
  id: z.string(),
});

const dashboardRowSchema = z.object({
  id: z.number(),
  items: z.array(dashboardItemSchema),
  columnSizes: z.array(z.number()),
});

const dashboardContentSchema = z.object({
  name: z.string(),
  rows: z.array(dashboardRowSchema),
  description: z.string(),
});

// Version entry schemas
const metricVersionEntrySchema = z.object({
  content: metricContentSchema,
  updated_at: z.string(), // ISO 8601 timestamp
  version_number: z.number(),
});

const dashboardVersionEntrySchema = z.object({
  content: dashboardContentSchema,
  updated_at: z.string(), // ISO 8601 timestamp
  version_number: z.number(),
});

// Version history schemas (the JSONB structure)
// Keys are string version numbers ("1", "2", etc.)
const metricVersionHistorySchema = z.record(z.string(), metricVersionEntrySchema);
const dashboardVersionHistorySchema = z.record(z.string(), dashboardVersionEntrySchema);

// Type exports
export type MetricContent = z.infer<typeof metricContentSchema>;
export type DashboardContent = z.infer<typeof dashboardContentSchema>;
export type MetricVersionEntry = z.infer<typeof metricVersionEntrySchema>;
export type DashboardVersionEntry = z.infer<typeof dashboardVersionEntrySchema>;
export type MetricVersionHistory = z.infer<typeof metricVersionHistorySchema>;
export type DashboardVersionHistory = z.infer<typeof dashboardVersionHistorySchema>;

// Schema exports
export {
  metricContentSchema,
  dashboardContentSchema,
  metricVersionEntrySchema,
  dashboardVersionEntrySchema,
  metricVersionHistorySchema,
  dashboardVersionHistorySchema,
};
