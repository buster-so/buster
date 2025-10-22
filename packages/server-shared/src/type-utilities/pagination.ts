import {
  type InfinitePaginationMetadata,
  InfinitePaginationSchema,
  PaginationInputSchema,
  type PaginationMetadata,
  PaginationSchema,
} from '@buster/database/schema-types';
import { z } from 'zod';

export {
  type InfinitePaginationMetadata,
  InfinitePaginationSchema,
  type PaginationMetadata,
  PaginationSchema,
} from '@buster/database/schema-types';

export type Pagination = PaginationMetadata;
export type SearchPagination = InfinitePaginationMetadata;

export const PaginatedResponseSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    data: z.array(schema),
    pagination: PaginationSchema,
  });

export const SearchPaginatedResponseSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    data: z.array(schema),
    pagination: InfinitePaginationSchema,
  });

export const GroupedPaginationResponseSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    groups: z.record(z.string(), z.array(schema)),
    pagination: InfinitePaginationSchema,
  });

export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<T>>>;
export type SearchPaginatedResponse<T> = z.infer<
  ReturnType<typeof SearchPaginatedResponseSchema<T>>
>;
export type GroupedPaginationResponse<T> = z.infer<
  ReturnType<typeof GroupedPaginationResponseSchema<T>>
>;
export const PaginatedRequestSchema = PaginationInputSchema;
