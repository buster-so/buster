import type { z } from 'zod';
import { CLIError } from './errors.js';

export class ZodValidationError extends CLIError {
  constructor(
    message: string,
    public errors: z.ZodError['errors'],
    public context?: string
  ) {
    const formattedErrors = errors
      .map(err => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    
    super(`${message}\n${formattedErrors}`, 'VALIDATION_ERROR');
  }
}

export function validateWithSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context?: string
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new ZodValidationError(
      context ? `Validation failed for ${context}` : 'Validation failed',
      result.error.errors,
      context
    );
  }
  
  return result.data;
}

export function validateCommandArgs<T>(
  args: unknown,
  schema: z.ZodSchema<T>,
  commandName: string
): T {
  const result = schema.safeParse(args);
  
  if (!result.success) {
    throw new ZodValidationError(
      `Invalid arguments for '${commandName}' command`,
      result.error.errors,
      commandName
    );
  }
  
  return result.data;
}

// Helper for safe parsing with defaults
export function parseWithDefaults<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError['errors'] } {
  const result = schema.safeParse(data);
  return result.success 
    ? { success: true, data: result.data }
    : { success: false, errors: result.error.errors };
}