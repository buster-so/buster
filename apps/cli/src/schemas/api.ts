import { z } from 'zod';

// Re-export relevant schemas from server-shared
// TODO: Update these imports when server-shared schemas are available
// export { 
//   CreateDataSourceRequestSchema,
//   CreateDataSourceResponseSchema,
//   ValidateModelRequestSchema,
//   ValidateModelResponseSchema 
// } from '@buster/server-shared';

// Common API error schema
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  statusCode: z.number(),
  details: z.record(z.any()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// API success response wrapper
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.literal(true),
  data: dataSchema,
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  total: z.number().int().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;