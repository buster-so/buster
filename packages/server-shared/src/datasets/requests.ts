import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities';

/**
 * Query parameters for listing datasets
 */
export const ListDatasetsQuerySchema = z
  .object({
    admin_view: z.coerce.boolean().optional().default(false), // Migrated from Rust v1 but not used
    enabled: z.coerce.boolean().optional(), // Migrated from Rust v1 but not used
    imported: z.coerce.boolean().optional(), // Migrated from Rust v1 but not used
    permission_group_id: z.string().uuid().optional(), // Migrated from Rust v1 but not used
    belongs_to: z.coerce.boolean().optional(), // Migrated from Rust v1 but not used
    data_source_id: z.string().uuid().optional(), // Migrated from Rust v1 but not used
  })
  .merge(PaginatedRequestSchema);

export type ListDatasetsQuery = z.infer<typeof ListDatasetsQuerySchema>;

/**
 * Path parameters for getting a single dataset
 */
export const GetDatasetParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetDatasetParams = z.infer<typeof GetDatasetParamsSchema>;
