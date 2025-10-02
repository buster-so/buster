import {
  PaginationInputSchema,
  type PaginationMetadata,
  PaginationSchema,
  type SearchPaginationMetadata,
  SearchPaginationSchema,
} from '@buster/database/schema-types';
import { z } from 'zod';

export {
  PaginationSchema,
  SearchPaginationSchema,
  type PaginationMetadata,
  type SearchPaginationMetadata,
} from '@buster/database/schema-types';

export type Pagination = PaginationMetadata;
export type SearchPagination = SearchPaginationMetadata;

export const PaginatedResponseSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    data: z.array(schema),
    pagination: PaginationSchema,
  });

export const SearchPaginatedResponseSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    data: z.array(schema),
    pagination: SearchPaginationSchema,
  });

export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<T>>>;
export type SearchPaginatedResponse<T> = z.infer<
  ReturnType<typeof SearchPaginatedResponseSchema<T>>
>;
export const PaginatedRequestSchema = PaginationInputSchema;
