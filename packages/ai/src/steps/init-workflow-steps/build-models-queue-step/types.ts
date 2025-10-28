import { z } from 'zod';

export const ModelQueueItemSchema = z.object({
  absolutePath: z.string().describe('Full path to the .sql file'),
  relativePath: z.string().describe('Path relative to the model directory root'),
  fileName: z.string().describe('Just the filename (e.g., "dim_customers.sql")'),
  modelName: z.string().describe('Model name without extension (e.g., "dim_customers")'),
  modelDirectory: z.string().describe('Which model-path directory this came from'),
});

export type ModelQueueItem = z.infer<typeof ModelQueueItemSchema>;
