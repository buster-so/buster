import {
  PaginationInputSchema,
  type PaginationMetadata,
  PaginationSchema,
} from '@buster/database/schema-types';
import { z } from 'zod';

export { PaginationSchema, type PaginationMetadata } from '@buster/database/schema-types';

export type Pagination = PaginationMetadata;

export const PaginatedResponseSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    data: z.array(schema),
    pagination: PaginationSchema,
  });

export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<T>>>;

export const PaginatedRequestSchema = PaginationInputSchema;
