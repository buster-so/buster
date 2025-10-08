import { tool } from 'ai';
import { z } from 'zod';
import { createRetrieveMetadataExecute } from './retrieve-metadata-execute';

export const RETRIEVE_METADATA_TOOL_NAME = 'retrieveMetadata';

export const RetrieveMetadataInputSchema = z.object({
  dataSourceId: z.string().min(1).describe('Data source identifier'),
  database: z.string().min(1).describe('Database name where the dataset resides'),
  schema: z.string().min(1).describe('Schema name where the dataset resides'),
  name: z.string().min(1).describe('Dataset/table name'),
});

const RetrieveMetadataContextSchema = z.object({
  apiKey: z.string().describe('API key for authentication'),
  apiUrl: z.string().describe('Base URL of the API server'),
});

export type RetrieveMetadataInput = z.infer<typeof RetrieveMetadataInputSchema>;
export type RetrieveMetadataContext = z.infer<typeof RetrieveMetadataContextSchema>;

const RetrieveMetadataOutputSchema = z.object({
  metadata: z
    .record(z.unknown())
    .describe('Dataset metadata containing column profiles and statistics'),
});

export type RetrieveMetadataOutput = z.infer<typeof RetrieveMetadataOutputSchema>;

// Factory function to create the retrieve-metadata tool
export function createRetrieveMetadataTool(context: RetrieveMetadataContext) {
  return tool({
    description: `Use this to retrieve metadata about a dataset from the data warehouse.
    This tool fetches detailed metadata including column profiles, statistics, distributions, and other analytical information about tables/datasets.
    The metadata can help understand data structure, quality, and characteristics before querying.`,
    inputSchema: RetrieveMetadataInputSchema,
    outputSchema: RetrieveMetadataOutputSchema,
    execute: createRetrieveMetadataExecute(context),
  });
}
