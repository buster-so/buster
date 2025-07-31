import * as yaml from 'yaml';
import { z } from 'zod';

/**
 * Schema for dimension/measure in YML
 */
export const YmlDimensionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  searchable: z.boolean().optional(),
  options: z.any().nullable().optional(),
});

export const YmlMeasureSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
});

/**
 * Schema for parsed dataset YML content
 */
export const ParsedDatasetYmlSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  data_source_name: z.string(),
  database: z.string(),
  schema: z.string(),
  dimensions: z.array(YmlDimensionSchema).default([]),
  measures: z.array(YmlMeasureSchema).default([]),
  metrics: z.array(z.any()).default([]),
  filters: z.array(z.any()).default([]),
  relationships: z.array(z.any()).default([]),
});

export type ParsedDatasetYml = z.infer<typeof ParsedDatasetYmlSchema>;
export type YmlDimension = z.infer<typeof YmlDimensionSchema>;
export type YmlMeasure = z.infer<typeof YmlMeasureSchema>;

/**
 * Column info extracted from YML
 */
export interface YmlColumnInfo {
  name: string;
  type: string;
  source: 'dimension' | 'measure';
}

/**
 * Parse dataset YML content and extract structured data
 * @param ymlContent Raw YML string content
 * @returns Parsed dataset structure
 * @throws Error if YML is invalid or doesn't match expected schema
 */
export function parseDatasetYml(ymlContent: string): ParsedDatasetYml {
  try {
    // Parse YML to object
    const parsed = yaml.parse(ymlContent);

    // Validate against schema
    const validated = ParsedDatasetYmlSchema.parse(parsed);

    return validated;
  } catch (error) {
    if (error instanceof Error && error.name === 'YAMLParseError') {
      throw new Error(`Invalid YML syntax: ${error.message}`);
    }

    if (error instanceof z.ZodError) {
      const issues = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid dataset YML structure: ${issues}`);
    }

    throw new Error(
      `Failed to parse YML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract all column references from parsed YML
 * @param parsedYml Parsed dataset YML
 * @returns Array of column information
 */
export function extractColumnsFromYml(parsedYml: ParsedDatasetYml): YmlColumnInfo[] {
  const columns: YmlColumnInfo[] = [];

  // Extract from dimensions
  for (const dimension of parsedYml.dimensions) {
    columns.push({
      name: dimension.name,
      type: dimension.type,
      source: 'dimension',
    });
  }

  // Extract from measures
  for (const measure of parsedYml.measures) {
    columns.push({
      name: measure.name,
      type: measure.type,
      source: 'measure',
    });
  }

  return columns;
}

/**
 * Normalize column names for comparison
 * Handles case sensitivity and common naming variations
 * @param columns Array of column info
 * @returns Normalized column info
 */
export function normalizeColumnNames(columns: YmlColumnInfo[]): YmlColumnInfo[] {
  return columns.map((col) => ({
    ...col,
    name: col.name.toLowerCase().trim(),
  }));
}
