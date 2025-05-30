import { z } from 'zod';

export const RerankResultSchema = z.object({
  index: z.number().int().min(0),
  relevance_score: z.number().min(0).max(1),
});

export type RerankResult = z.infer<typeof RerankResultSchema>;

export const RerankRequestSchema = z.object({
  query: z.string().min(1),
  documents: z.array(z.string()).min(1),
  top_n: z.number().int().min(1).optional(),
  model: z.string().optional(),
});

export type RerankRequest = z.infer<typeof RerankRequestSchema>;

export const RerankResponseSchema = z.object({
  results: z.array(RerankResultSchema),
});

export type RerankResponse = z.infer<typeof RerankResponseSchema>;

export interface RerankConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}
