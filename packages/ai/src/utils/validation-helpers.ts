import { z } from 'zod';

/**
 * Type Safety Foundation - Validation Utilities
 *
 * This module provides Zod schemas and minimal helper functions for type-safe
 * runtime validation across the AI package. Follows the Zod-first approach
 * where schemas are the single source of truth for both validation and types.
 */

// ============================================================================
// RUNTIME CONTEXT SCHEMAS
// ============================================================================

/**
 * Base runtime context schema for common fields used across workflows
 */
export const baseRuntimeContextSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
});

/**
 * Analyst workflow runtime context schema - Full schema for main workflow
 */
export const analystRuntimeContextSchema = baseRuntimeContextSchema.extend({
  threadId: z.string().min(1, 'Thread ID is required'),
  dataSourceId: z.string().min(1, 'Data source ID is required'),
  dataSourceSyntax: z.string().min(1, 'Data source syntax is required'),
  todos: z.string(),
  messageId: z.string().optional(),
});

/**
 * Runtime context schema for initial steps that only need threadId and userId
 * Used by: generate-chat-title, extract-values-search, create-todos
 */
export const initialStepRuntimeContextSchema = baseRuntimeContextSchema.extend({
  threadId: z.string().min(1, 'Thread ID is required'),
  messageId: z.string().optional(),
});

/**
 * Runtime context schema for think-and-prep step
 * Needs dataSourceId and dataSourceSyntax but not todos (gets from input)
 */
export const thinkAndPrepRuntimeContextSchema = baseRuntimeContextSchema.extend({
  threadId: z.string().min(1, 'Thread ID is required'),
  dataSourceId: z.string().min(1, 'Data source ID is required'),
  dataSourceSyntax: z.string().min(1, 'Data source syntax is required'),
  messageId: z.string().optional(),
});

/**
 * Tool execution context schema for tools that need runtime context
 */
export const toolRuntimeContextSchema = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  dataSourceId: z.string().optional(),
  sessionId: z.string().optional(),
  messageId: z.string().optional(),
});

// Infer types from schemas
export type BaseRuntimeContext = z.infer<typeof baseRuntimeContextSchema>;
export type AnalystRuntimeContext = z.infer<typeof analystRuntimeContextSchema>;
export type InitialStepRuntimeContext = z.infer<typeof initialStepRuntimeContextSchema>;
export type ThinkAndPrepRuntimeContext = z.infer<typeof thinkAndPrepRuntimeContextSchema>;
export type ToolRuntimeContext = z.infer<typeof toolRuntimeContextSchema>;

// ============================================================================
// DATABASE RESULT SCHEMAS
// ============================================================================

/**
 * Schema for database secret result from vault.decrypted_secrets
 */
export const secretResultSchema = z
  .array(
    z.object({
      decrypted_secret: z.string().min(1, 'Decrypted secret cannot be empty'),
    })
  )
  .min(1, 'Secret result must contain at least one entry');

/**
 * Schema for database credentials (parsed from decrypted_secret)
 * More flexible schema that accepts any credential structure
 */
export const credentialsSchema = z
  .record(z.unknown())
  .refine((data) => typeof data.type === 'string' && data.type.length > 0, {
    message: 'Credential type is required and must be a non-empty string',
  });

// Infer types from schemas
export type SecretResult = z.infer<typeof secretResultSchema>;
export type Credentials = z.infer<typeof credentialsSchema>;

// ============================================================================
// TOOL INPUT/OUTPUT SCHEMAS
// ============================================================================

/**
 * Schema for done tool execution input (replaces input: any)
 */
export const doneToolExecuteInputSchema = z.object({
  context: z
    .object({
      runtimeContext: z.any().optional(), // RuntimeContext is not easily schema-validated
    })
    .optional(),
  runtimeContext: z.any().optional(), // RuntimeContext is not easily schema-validated
});

export type DoneToolExecuteInput = z.infer<typeof doneToolExecuteInputSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validates that a required value is not null or undefined
 * Provides type narrowing for TypeScript
 */
export function validateRequired<T>(value: T | undefined | null, fieldName: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Required field ${fieldName} is missing`);
  }
  return value;
}

/**
 * Type guard for Error instances
 * Helps with error handling in catch blocks
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safe array access with bounds checking
 * Required for TypeScript strict mode (noUncheckedIndexedAccess)
 */
export function validateArrayAccess<T>(array: T[], index: number, context: string): T {
  if (index < 0 || index >= array.length) {
    throw new Error(
      `Array index ${index} out of bounds in ${context}. Array length: ${array.length}`
    );
  }
  return array[index]!; // Safe due to bounds check above
}

/**
 * Validates runtime context has required fields for a specific operation
 * Uses Zod schema validation for type safety
 */
export function validateRuntimeContext<T extends Record<string, unknown>>(
  context: { get: (key: string) => unknown } | undefined | null,
  schema: z.ZodSchema<T>,
  operation: string
): T {
  if (!context || typeof context.get !== 'function') {
    throw new Error(`Runtime context is required for ${operation}`);
  }

  // Extract all values from the runtime context
  const contextData: Record<string, unknown> = {};

  // Get all possible field names from the schema shape
  // First, try parsing an empty object to see what fields are expected
  const emptyResult = schema.safeParse({});
  if (!emptyResult.success && emptyResult.error) {
    // Extract field names from error paths and also check common fields
    const errorPaths = emptyResult.error.errors.map((e) => e.path[0] as string);
    const commonFields = [
      'userId',
      'organizationId',
      'dataSourceId',
      'sessionId',
      'messageId',
      'threadId',
      'dataSourceSyntax',
      'todos',
    ];
    const allFields = [...new Set([...errorPaths, ...commonFields])];

    // Try to get all fields from context
    for (const field of allFields) {
      const value = context.get(field);
      if (value !== undefined) {
        contextData[field] = value;
      }
    }
  } else {
    // If the schema accepts an empty object, try common fields
    const commonFields = [
      'userId',
      'organizationId',
      'dataSourceId',
      'sessionId',
      'messageId',
      'threadId',
      'dataSourceSyntax',
      'todos',
    ];
    for (const field of commonFields) {
      const value = context.get(field);
      if (value !== undefined) {
        contextData[field] = value;
      }
    }
  }

  try {
    return schema.parse(contextData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid runtime context for ${operation}: ${issues}`);
    }
    throw new Error(
      `Runtime context validation failed for ${operation}: ${isError(error) ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Safely parses JSON with proper error handling
 * Returns parsed object with Zod validation
 */
export function safeJsonParse<T>(jsonString: string, schema: z.ZodSchema<T>, context: string): T {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON in ${context}: ${isError(error) ? error.message : 'Invalid JSON'}`
    );
  }

  try {
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Invalid JSON structure in ${context}: ${issues}`);
    }
    throw new Error(
      `JSON validation failed in ${context}: ${isError(error) ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validates that a value exists and is of the expected type
 * Useful for validating external API responses or database results
 */
export function validateExists<T>(
  value: T | undefined | null,
  fieldName: string,
  context: string
): T {
  if (value === undefined || value === null) {
    throw new Error(`Expected field ${fieldName} is missing in ${context}`);
  }
  return value;
}
