import { z } from 'zod';

// MetricYml type that matches Rust exactly (API format with snake_case)
const metricYmlSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  time_frame: z.string(), // Note: Rust uses time_frame, not timeFrame
  sql: z.string(),
  chart_config: z.any(), // Complex chart config - using any for now to match Rust flexibility
});

// MetricYml storage format (camelCase for database storage)
const metricYmlStorageSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  timeFrame: z.string(), // camelCase for storage
  sql: z.string(),
  chartConfig: z.any(), // camelCase for storage
});

// DashboardYml type that matches Rust exactly
const rowItemSchema = z.object({
  id: z.string().uuid(), // Rust uses Uuid
});

const rowSchema = z.object({
  items: z.array(rowItemSchema),
  row_height: z.number().optional(),
  column_sizes: z.array(z.number()),
  id: z.number(),
});

const dashboardYmlSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rows: z.array(rowSchema),
});

// DashboardYml storage format (camelCase for database storage)
const dashboardYmlStorageSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rows: z.array(
    z.object({
      id: z.number(),
      items: z.array(rowItemSchema),
      columnSizes: z.array(z.number()), // camelCase for storage
      rowHeight: z.number().optional(), // camelCase for storage
    })
  ),
});

// Version struct that matches Rust exactly - content is stored directly
const versionSchema = z.object({
  version_number: z.number().int(), // Rust uses i32
  updated_at: z.string().datetime(), // Rust uses DateTime<Utc> - ISO 8601 string
  content: z.any(), // Content is stored directly as MetricYml or DashboardYml without enum wrapper
});

// VersionHistory struct that matches Rust exactly
// This is a HashMap<String, Version> in Rust
const versionHistorySchema = z.record(z.string(), versionSchema);

// Type exports that match Rust exactly (API format)
export type MetricYml = z.infer<typeof metricYmlSchema>;
export type DashboardYml = z.infer<typeof dashboardYmlSchema>;

// Storage format types (camelCase)
export type MetricYmlStorage = z.infer<typeof metricYmlStorageSchema>;
export type DashboardYmlStorage = z.infer<typeof dashboardYmlStorageSchema>;
export type RowItem = z.infer<typeof rowItemSchema>;
export type Row = z.infer<typeof rowSchema>;
// VersionContent is no longer needed - content is stored directly
export type Version = z.infer<typeof versionSchema>;
export type VersionHistory = z.infer<typeof versionHistorySchema>;

// Schema exports
export {
  metricYmlSchema,
  dashboardYmlSchema,
  metricYmlStorageSchema,
  dashboardYmlStorageSchema,
  rowItemSchema,
  rowSchema,
  versionSchema,
  versionHistorySchema,
};
