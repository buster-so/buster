import { z } from 'zod';

// MetricYml type that matches Rust exactly
const metricYmlSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  time_frame: z.string(), // Note: Rust uses time_frame, not timeFrame
  sql: z.string(),
  chart_config: z.any(), // Complex chart config - using any for now to match Rust flexibility
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

// VersionContent enum that matches Rust exactly
const versionContentSchema = z.union([
  z.object({
    MetricYml: metricYmlSchema,
  }),
  z.object({
    DashboardYml: dashboardYmlSchema,
  }),
]);

// Version struct that matches Rust exactly
const versionSchema = z.object({
  version_number: z.number().int(), // Rust uses i32
  updated_at: z.string().datetime(), // Rust uses DateTime<Utc> - ISO 8601 string
  content: versionContentSchema,
});

// VersionHistory struct that matches Rust exactly
// This is a HashMap<String, Version> in Rust
const versionHistorySchema = z.record(z.string(), versionSchema);

// Type exports that match Rust exactly
export type MetricYml = z.infer<typeof metricYmlSchema>;
export type DashboardYml = z.infer<typeof dashboardYmlSchema>;
export type RowItem = z.infer<typeof rowItemSchema>;
export type Row = z.infer<typeof rowSchema>;
export type VersionContent = z.infer<typeof versionContentSchema>;
export type Version = z.infer<typeof versionSchema>;
export type VersionHistory = z.infer<typeof versionHistorySchema>;

// Schema exports
export {
  metricYmlSchema,
  dashboardYmlSchema,
  rowItemSchema,
  rowSchema,
  versionContentSchema,
  versionSchema,
  versionHistorySchema,
};
