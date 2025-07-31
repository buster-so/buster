import { z } from 'zod';
import type { Dataset } from './getDatasetsWithYmlContent';

/**
 * Schema for database/schema combination
 */
export const DatabaseSchemaSchema = z.object({
  database: z.string(),
  schema: z.string(),
});

export type DatabaseSchema = z.infer<typeof DatabaseSchemaSchema>;

/**
 * Dataset grouped by database/schema
 */
export interface DatasetsByDatabaseSchema {
  databaseSchema: DatabaseSchema;
  datasets: Dataset[];
}

/**
 * Extract unique database/schema combinations from datasets
 * Groups datasets by their database and schema to enable lightweight introspection
 * This reduces the number of introspection queries needed
 */
export function getDistinctDatabaseSchemas(datasets: Dataset[]): DatasetsByDatabaseSchema[] {
  if (!datasets.length) {
    return [];
  }

  // Group datasets by database and schema
  const groupedMap = new Map<string, DatasetsByDatabaseSchema>();

  for (const dataset of datasets) {
    // Create a unique key for database/schema combination
    const key = `${dataset.databaseName}::${dataset.schema}`;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        databaseSchema: {
          database: dataset.databaseName,
          schema: dataset.schema,
        },
        datasets: [],
      });
    }

    const group = groupedMap.get(key);
    if (group) {
      group.datasets.push(dataset);
    }
  }

  // Convert map to array
  return Array.from(groupedMap.values());
}
