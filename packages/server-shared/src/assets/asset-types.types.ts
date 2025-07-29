import { z } from 'zod';

export const AssetTypeSchema = z.enum([
  'thread',
  'chat',
  'metric_file',
  'dashboard_file',
  'collection',
  'data_source',
  'filter',
  'dataset',
  'tool',
  'source',
  'collection_file',
  'dataset_permission',
]);

export type AssetType = z.infer<typeof AssetTypeSchema>;
