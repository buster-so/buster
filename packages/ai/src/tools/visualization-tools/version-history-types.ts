import { z } from 'zod';

// MetricYml type using camelCase (TypeScript standard)
const metricYmlSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  timeFrame: z.string(), // camelCase for TypeScript
  sql: z.string(),
  chartConfig: z.any(), // camelCase for TypeScript
});

// DashboardYml type that matches Rust exactly
const rowItemSchema = z.object({
  id: z.string().uuid(), // Rust uses Uuid
});

const rowSchema = z.object({
  id: z.number(),
  items: z.array(rowItemSchema),
  columnSizes: z.array(z.number()), // camelCase for TypeScript
  rowHeight: z.number().optional(), // camelCase for TypeScript
});

const dashboardYmlSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rows: z.array(rowSchema),
});

// No separate storage schema needed - using camelCase throughout

// Version struct that matches Rust exactly - content is stored directly
const versionSchema = z.object({
  version_number: z.number().int(), // Rust uses i32
  updated_at: z.string().datetime(), // Rust uses DateTime<Utc> - ISO 8601 string
  content: z.any(), // Content is stored directly as MetricYml or DashboardYml without enum wrapper
});

// VersionHistory struct that matches Rust exactly
// This is a HashMap<String, Version> in Rust
const versionHistorySchema = z.record(z.string(), versionSchema);

// Type exports using camelCase (TypeScript standard)
export type MetricYml = z.infer<typeof metricYmlSchema>;
export type DashboardYml = z.infer<typeof dashboardYmlSchema>;
export type RowItem = z.infer<typeof rowItemSchema>;
export type Row = z.infer<typeof rowSchema>;
// VersionContent is no longer needed - content is stored directly
export type Version = z.infer<typeof versionSchema>;
export type VersionHistory = z.infer<typeof versionHistorySchema>;

// Schema exports
export {
  metricYmlSchema,
  dashboardYmlSchema,
  rowItemSchema,
  rowSchema,
  versionSchema,
  versionHistorySchema,
};
