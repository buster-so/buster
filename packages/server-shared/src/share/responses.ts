import z from 'zod';

// Sharing operation response schemas
export const SharePostResponseSchema = z.object({
  success: z.boolean(),
  shared: z.array(z.string()),
  notFound: z.array(z.string()),
});

export const ShareDeleteResponseSchema = z.object({
  success: z.boolean(),
  removed: z.array(z.string()),
  notFound: z.array(z.string()),
});

export type SharePostResponse = z.infer<typeof SharePostResponseSchema>;
export type ShareDeleteResponse = z.infer<typeof ShareDeleteResponseSchema>;
