import { z } from 'zod';

// Shared types for system prompts

// Zod schemas for runtime validation
export const BasePromptVariablesSchema = z.object({
  todaysDate: z.string().optional(),
  datasets: z.string().optional(),
  datasetDescriptions: z.string().optional(),
});

export const AnalysisPromptVariablesSchema = BasePromptVariablesSchema.extend({
  sqlDialectGuidance: z.string().optional(),
});

// Schemas for other modes
export const InitializationPromptVariablesSchema = BasePromptVariablesSchema.extend({
  // Initialization mode requires todaysDate and datasets
  todaysDate: z.string(),
  datasets: z.string(),
});

export const FollowUpInitializationPromptVariablesSchema = BasePromptVariablesSchema.extend({
  // Follow-up initialization only requires todaysDate
  todaysDate: z.string(),
});

export const DataCatalogSearchPromptVariablesSchema = BasePromptVariablesSchema.extend({
  // Data catalog search requires datasetDescriptions and datasets
  datasetDescriptions: z.string(),
  datasets: z.string(),
});

export const PlanningPromptVariablesSchema = BasePromptVariablesSchema.extend({
  // Planning requires todaysDate and datasets
  todaysDate: z.string(),
  datasets: z.string(),
});

export const ReviewPromptVariablesSchema = BasePromptVariablesSchema.extend({
  // Review mode has no required variables, all are optional
});

// TypeScript types inferred from Zod schemas
export type BasePromptVariables = z.infer<typeof BasePromptVariablesSchema>;
export type AnalysisPromptVariables = z.infer<typeof AnalysisPromptVariablesSchema>;
export type InitializationPromptVariables = z.infer<typeof InitializationPromptVariablesSchema>;
export type FollowUpInitializationPromptVariables = z.infer<
  typeof FollowUpInitializationPromptVariablesSchema
>;
export type DataCatalogSearchPromptVariables = z.infer<
  typeof DataCatalogSearchPromptVariablesSchema
>;
export type PlanningPromptVariables = z.infer<typeof PlanningPromptVariablesSchema>;
export type ReviewPromptVariables = z.infer<typeof ReviewPromptVariablesSchema>;

export interface SystemPrompt<T = BasePromptVariables> {
  template: string;
  requiredVariables: (keyof T)[];
  optionalVariables?: (keyof T)[];
  schema?: z.ZodSchema<T>; // Optional schema for validation
}

// Enhanced prompt injector with Zod validation
export function createPromptInjector<T extends BasePromptVariables>(schema?: z.ZodSchema<T>) {
  return function injectVariables(prompt: SystemPrompt<T>, variables: T): string {
    // Validate with Zod schema if provided
    if (schema) {
      const validation = schema.safeParse(variables);
      if (!validation.success) {
        throw new Error(`Invalid variables: ${validation.error.message}`);
      }
    }

    // Check required variables (existing logic)
    for (const required of prompt.requiredVariables) {
      if (!variables[required]) {
        throw new Error(`Required variable '${String(required)}' is missing`);
      }
    }

    let result = prompt.template;

    // Replace variables (existing logic)
    if (variables.todaysDate) {
      result = result.replace(/{TODAYS_DATE}/g, variables.todaysDate);
    }
    if (variables.datasets) {
      result = result.replace(/{DATASETS}/g, variables.datasets);
    }
    if (variables.datasetDescriptions) {
      result = result.replace(/{DATASET_DESCRIPTIONS}/g, variables.datasetDescriptions);
    }
    if ('sqlDialectGuidance' in variables && typeof variables.sqlDialectGuidance === 'string') {
      result = result.replace(/{SQL_DIALECT_GUIDANCE}/g, variables.sqlDialectGuidance);
    }

    return result;
  };
}

// Specialized validators for each mode
export const validateBasePromptVariables = (variables: unknown): BasePromptVariables => {
  return BasePromptVariablesSchema.parse(variables);
};

export const validateAnalysisPromptVariables = (variables: unknown): AnalysisPromptVariables => {
  return AnalysisPromptVariablesSchema.parse(variables);
};

export const validateInitializationPromptVariables = (
  variables: unknown
): InitializationPromptVariables => {
  return InitializationPromptVariablesSchema.parse(variables);
};

export const validateFollowUpInitializationPromptVariables = (
  variables: unknown
): FollowUpInitializationPromptVariables => {
  return FollowUpInitializationPromptVariablesSchema.parse(variables);
};

export const validateDataCatalogSearchPromptVariables = (
  variables: unknown
): DataCatalogSearchPromptVariables => {
  return DataCatalogSearchPromptVariablesSchema.parse(variables);
};

export const validatePlanningPromptVariables = (variables: unknown): PlanningPromptVariables => {
  return PlanningPromptVariablesSchema.parse(variables);
};

export const validateReviewPromptVariables = (variables: unknown): ReviewPromptVariables => {
  return ReviewPromptVariablesSchema.parse(variables);
};

// Helper to create type-safe system prompts
export function createTypeSafeSystemPrompt<T extends BasePromptVariables>(config: {
  template: string;
  requiredVariables: (keyof T)[];
  optionalVariables?: (keyof T)[];
  schema: z.ZodSchema<T>;
}): SystemPrompt<T> {
  return {
    template: config.template,
    requiredVariables: config.requiredVariables,
    optionalVariables: config.optionalVariables,
    schema: config.schema,
  };
}
