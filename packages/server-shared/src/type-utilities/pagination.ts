import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
  total_pages: z.number(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = <T>(schema: z.ZodType<T>) =>
  z.object({
    data: z.array(schema),
    pagination: PaginationSchema,
  });

export type PaginatedResponse<T> = z.infer<ReturnType<typeof PaginatedResponseSchema<T>>>;

export const PaginatedRequestSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  page_size: z.coerce.number().min(1).max(5000).default(250),
});
