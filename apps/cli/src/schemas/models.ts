import { z } from 'zod';

// Basic semantic model schema for YAML validation
export const SemanticModelSchema = z.object({
  version: z.number(),
  type: z.enum(['model', 'metric', 'dimension']),
  name: z.string(),
  description: z.string().optional(),
  sql: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
});

export type SemanticModel = z.infer<typeof SemanticModelSchema>;

// Model validation result schema
export const ModelValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    path: z.string(),
    message: z.string(),
    line: z.number().optional(),
  })).optional(),
  warnings: z.array(z.object({
    path: z.string(),
    message: z.string(),
  })).optional(),
});

export type ModelValidationResult = z.infer<typeof ModelValidationResultSchema>;