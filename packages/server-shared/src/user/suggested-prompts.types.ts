import { z } from 'zod';

// Core suggested prompts schema that matches the database schema
export const SuggestedPromptsSchema = z.object({
  report: z.array(z.string()),
  dashboard: z.array(z.string()),
  visualization: z.array(z.string()),
  help: z.array(z.string()),
});

export type SuggestedPrompts = z.infer<typeof SuggestedPromptsSchema>;

// Request schemas
export const GenerateSuggestedPromptsRequestSchema = z.object({
  userId: z.string().uuid().optional(), // Optional for admin use - defaults to authenticated user
});

export const GetSuggestedPromptsRequestSchema = z.object({
  userId: z.string().uuid().optional(), // Optional for admin use - defaults to authenticated user
});

// Response schemas
export const SuggestedPromptsResponseSchema = z.object({
  suggestedPrompts: SuggestedPromptsSchema,
  updatedAt: z.string(), // ISO timestamp string
});

// Inferred types
export type GenerateSuggestedPromptsRequest = z.infer<typeof GenerateSuggestedPromptsRequestSchema>;
export type GetSuggestedPromptsRequest = z.infer<typeof GetSuggestedPromptsRequestSchema>;
export type SuggestedPromptsResponse = z.infer<typeof SuggestedPromptsResponseSchema>;
