import { DataSourceTypeSchema } from '@buster/database/schema-types';
import { z } from 'zod';

/**
 * Dataset owner information
 */
export const DatasetOwnerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  avatar_url: z.string().nullable().optional(),
});

export type DatasetOwner = z.infer<typeof DatasetOwnerSchema>;

/**
 * Dataset data source information
 */
export const DatasetDataSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export type DatasetDataSource = z.infer<typeof DatasetDataSourceSchema>;

/**
 * Dataset object in list response
 */
export const ListDatasetObjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  data_source: DatasetDataSourceSchema,
  last_queried: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  enabled: z.boolean(),
  imported: z.boolean(),
  owner: DatasetOwnerSchema,
  belongs_to: z.boolean().nullable(),
});

export type ListDatasetObject = z.infer<typeof ListDatasetObjectSchema>;

/**
 * Response for listing datasets
 */
export const ListDatasetsResponseSchema = z.array(ListDatasetObjectSchema);

export type ListDatasetsResponse = z.infer<typeof ListDatasetsResponseSchema>;

/**
 * Response for getting a single dataset
 */
export const BusterDatasetSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  name: z.string(),
  sql: z.string(),
  yml_file: z.string(),
  data_source_name: z.string(),
  data_source_type: DataSourceTypeSchema,
  data_source_id: z.string().uuid(),
});

export type BusterDataset = z.infer<typeof BusterDatasetSchema>;
