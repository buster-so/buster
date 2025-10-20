import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import type { ZodError, ZodIssue } from 'zod';
import { type Model, ModelSchema } from '../schemas';
import { DbtFileSchema } from './dbt-schemas';
import {
  transformDbtFileToBusterModels,
  validateDbtFileForTransformation,
} from './dbt-to-buster-transformer';
import { detectFileType } from './file-type-detection';

/**
 * Result of parsing a model file - can contain both successful models and errors
 */
export interface ParseModelResult {
  models: Model[];
  errors: Array<{
    modelName?: string;
    issues: ZodIssue[];
    rawData?: unknown; // Include raw data for better error formatting
  }>;
}

/**
 * Check if a file contains any {{TODO}} markers
 */
export async function fileContainsTodo(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content.includes('{{TODO}}');
  } catch {
    return false;
  }
}

/**
 * Parse a YAML model file and return both successful models and validation errors
 * Supports both Buster format and dbt format files
 * Now collects ALL validation errors instead of failing on first error
 */
export async function parseModelFile(filePath: string): Promise<ParseModelResult> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Check for {{TODO}} markers before parsing YAML
    // This avoids YAML parsing errors when {{TODO}} appears in complex structures
    if (content.includes('{{TODO}}')) {
      return {
        models: [],
        errors: [
          {
            issues: [
              {
                code: 'custom',
                path: [],
                message: 'File contains {{TODO}} markers and will be skipped',
              } as ZodIssue,
            ],
          },
        ],
      };
    }

    const rawData = yaml.load(content) as unknown;

    if (!rawData || typeof rawData !== 'object') {
      throw new Error(`Invalid YAML structure in ${filePath}`);
    }

    // Detect file type (Buster vs dbt)
    const fileType = detectFileType(rawData);

    if (fileType === 'buster') {
      // Parse as Buster model file (existing logic)
      return parseBusterModel(rawData);
    } else if (fileType === 'dbt') {
      // Parse as dbt file (new logic)
      return parseDbtFile(rawData, filePath);
    } else {
      // Unknown format
      return {
        models: [],
        errors: [
          {
            issues: [
              {
                code: 'custom',
                path: [],
                message:
                  'Unknown file format. Expected Buster YAML (single model with dimensions/measures) or dbt YAML (with models/semantic_models arrays).',
              } as ZodIssue,
            ],
          },
        ],
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new ModelParsingError(`Error reading model file: ${error.message}`, filePath);
    }
    throw new ModelParsingError('Unknown error parsing model file', filePath);
  }
}

/**
 * Parse a Buster format model
 * Extracted from original parseModelFile logic for clarity
 */
function parseBusterModel(rawData: unknown): ParseModelResult {
  // Parse as single model file (flat structure, no 'models' key)
  const parseResult = ModelSchema.safeParse(rawData);
  if (parseResult.success) {
    return {
      models: [parseResult.data],
      errors: [],
    };
  }

  // Extract and return detailed validation errors with raw data
  const errors = extractModelValidationErrors(rawData, parseResult.error);
  // Add raw data to errors for better formatting
  const errorsWithData = errors.map((e) => ({ ...e, rawData }));

  return {
    models: [],
    errors: errorsWithData,
  };
}

/**
 * Parse a dbt format file
 * Validates and transforms dbt YAML to Buster models
 */
function parseDbtFile(rawData: unknown, filePath: string): ParseModelResult {
  // Validate against dbt schema
  const parseResult = DbtFileSchema.safeParse(rawData);

  if (!parseResult.success) {
    return {
      models: [],
      errors: [
        {
          issues: parseResult.error.issues,
          rawData,
        },
      ],
    };
  }

  // Validate dbt file structure
  const validation = validateDbtFileForTransformation(parseResult.data);
  if (!validation.valid) {
    return {
      models: [],
      errors: validation.errors.map((error) => ({
        issues: [
          {
            code: 'custom',
            path: [],
            message: error,
          } as ZodIssue,
        ],
      })),
    };
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn(`Warnings while parsing ${filePath}:`);
    for (const warning of validation.warnings) {
      console.warn(`  - ${warning}`);
    }
  }

  // Transform dbt to Buster models
  try {
    const busterModels = transformDbtFileToBusterModels(parseResult.data);
    return {
      models: busterModels,
      errors: [],
    };
  } catch (error) {
    return {
      models: [],
      errors: [
        {
          issues: [
            {
              code: 'custom',
              path: [],
              message: `Failed to transform dbt file to Buster format: ${error instanceof Error ? error.message : String(error)}`,
            } as ZodIssue,
          ],
        },
      ],
    };
  }
}

/**
 * Parse a YAML model file and throw on any errors (backward compatibility)
 */
export async function parseModelFileStrict(filePath: string): Promise<Model[]> {
  const result = await parseModelFile(filePath);

  if (result.errors.length > 0) {
    const allIssues = result.errors.flatMap((e) => e.issues);
    const zodError = { issues: allIssues } as ZodError;
    throw new ModelParsingError(`Failed to parse model file`, filePath, zodError);
  }

  return result.models;
}

/**
 * Extract detailed validation errors from Zod error
 */
function extractModelValidationErrors(
  rawData: unknown,
  zodError: ZodError
): Array<{ modelName?: string; issues: ZodIssue[] }> {
  // Try to get the model name if it exists and is valid
  const data = rawData as Record<string, unknown>;
  const modelName = data && typeof data.name === 'string' ? data.name : undefined;

  return [
    {
      ...(modelName !== undefined && { modelName }),
      issues: zodError.issues,
    },
  ];
}

/**
 * Check if a value contains a TODO marker
 */
function containsTodoMarker(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.includes('{{TODO}}');
  }
  if (Array.isArray(value)) {
    return value.some(containsTodoMarker);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(containsTodoMarker);
  }
  return false;
}

/**
 * Find all TODO markers in a model
 */
export function findTodoMarkers(model: Model): string[] {
  const todos: string[] = [];

  // Check description
  if (model.description && containsTodoMarker(model.description)) {
    todos.push(`description contains {{TODO}}`);
  }

  // Check dimensions
  model.dimensions.forEach((dim) => {
    if (dim.description && containsTodoMarker(dim.description)) {
      todos.push(`dimension '${dim.name}' description contains {{TODO}}`);
    }
    if (dim.type && containsTodoMarker(dim.type)) {
      todos.push(`dimension '${dim.name}' type contains {{TODO}}`);
    }
    if (dim.options && containsTodoMarker(dim.options)) {
      todos.push(`dimension '${dim.name}' options contains {{TODO}}`);
    }
  });

  // Check measures
  model.measures.forEach((measure) => {
    if (measure.description && containsTodoMarker(measure.description)) {
      todos.push(`measure '${measure.name}' description contains {{TODO}}`);
    }
    if (measure.type && containsTodoMarker(measure.type)) {
      todos.push(`measure '${measure.name}' type contains {{TODO}}`);
    }
  });

  // Check metrics
  model.metrics.forEach((metric) => {
    if (metric.description && containsTodoMarker(metric.description)) {
      todos.push(`metric '${metric.name}' description contains {{TODO}}`);
    }
    if (containsTodoMarker(metric.expr)) {
      todos.push(`metric '${metric.name}' expression contains {{TODO}}`);
    }
  });

  // Check filters
  model.filters.forEach((filter) => {
    if (filter.description && containsTodoMarker(filter.description)) {
      todos.push(`filter '${filter.name}' description contains {{TODO}}`);
    }
    if (containsTodoMarker(filter.expr)) {
      todos.push(`filter '${filter.name}' expression contains {{TODO}}`);
    }
  });

  // Check relationships
  model.relationships.forEach((rel) => {
    if (rel.description && containsTodoMarker(rel.description)) {
      todos.push(`relationship '${rel.name}' description contains {{TODO}}`);
    }
    if (containsTodoMarker(rel.source_col)) {
      todos.push(`relationship '${rel.name}' source_col contains {{TODO}}`);
    }
    if (containsTodoMarker(rel.ref_col)) {
      todos.push(`relationship '${rel.name}' ref_col contains {{TODO}}`);
    }
  });

  // Check clarifications
  if (model.clarifications) {
    model.clarifications.forEach((clarification, index) => {
      if (containsTodoMarker(clarification)) {
        todos.push(`clarification #${index + 1} contains {{TODO}}`);
      }
    });
  }

  return todos;
}

/**
 * Validate a model against business rules
 * Returns ALL validation errors (doesn't stop at first error)
 */
export function validateModel(model: Model): {
  valid: boolean;
  errors: string[];
  todos: string[];
} {
  const errors: string[] = [];
  const todos = findTodoMarkers(model);

  // Validate model name
  if (!model.name || model.name.trim().length === 0) {
    errors.push('Model name is required');
  }

  // Validate that model has at least one dimension or measure
  if (model.dimensions.length === 0 && model.measures.length === 0) {
    errors.push('Model must have at least one dimension or measure');
  }

  // Note: Duplicate name validation is now handled by the ModelSchema itself
  // via Zod refinements, so we don't need to check for duplicates here

  // Validate metric expressions
  for (const metric of model.metrics) {
    if (!metric.expr || metric.expr.trim().length === 0) {
      errors.push(`Metric ${metric.name} must have an expression`);
    }
  }

  // Validate filter expressions
  for (const filter of model.filters) {
    if (!filter.expr || filter.expr.trim().length === 0) {
      errors.push(`Filter ${filter.name} must have an expression`);
    }
  }

  // Validate relationships
  for (const rel of model.relationships) {
    if (!rel.source_col || !rel.ref_col) {
      errors.push(`Relationship ${rel.name} must have source_col and ref_col`);
    }
  }

  return {
    valid: errors.length === 0 && todos.length === 0,
    errors,
    todos,
  };
}

/**
 * Resolve model configuration by merging with config values
 * Model values take precedence over config values
 */
export function resolveModelConfig(
  model: Model,
  config: {
    data_source_name?: string | undefined;
    database?: string | undefined;
    schema?: string | undefined;
  }
): Model {
  return {
    ...model,
    data_source_name: model.data_source_name || config.data_source_name,
    database: model.database || config.database,
    schema: model.schema || config.schema,
  };
}

/**
 * Generate default SQL for a model
 * Used when no SQL file is found
 */
export function generateDefaultSQL(model: Model): string {
  const database = model.database ? `${model.database}.` : '';
  const schema = model.schema ? `${model.schema}.` : '';
  return `SELECT * FROM ${database}${schema}${model.name}`;
}

/**
 * Model parsing error class for backwards compatibility with tests
 */
export class ModelParsingError extends Error {
  public file: string;
  public zodError: ZodError | undefined;

  constructor(message: string, file: string, zodError?: ZodError) {
    super(message);
    this.name = 'ModelParsingError';
    this.file = file;
    if (zodError) {
      this.zodError = zodError;
    }
  }

  getDetailedMessage(): string {
    let message = `${this.message} (${this.file})`;

    if (this.zodError) {
      message += '\nValidation errors:';
      for (const issue of this.zodError.issues) {
        const path = issue.path.join('.');
        message += `\n  - ${path}: ${issue.message}`;
      }
    }

    return message;
  }
}

/**
 * Functional factory for model parsing errors (keeps same signature for existing code)
 */
export function createModelParsingError(
  message: string,
  file: string,
  zodError?: ZodError
): ModelParsingError {
  return new ModelParsingError(message, file, zodError);
}

/**
 * Format Zod issues into readable error messages
 */
export function formatZodIssues(issues: ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
}

/**
 * Format Zod issues with context about field names
 * @param issues - The Zod validation issues
 * @param data - The raw data being validated to extract field names
 */
export function formatZodIssuesWithContext(issues: ZodIssue[], data: unknown): string[] {
  return issues.map((issue) => {
    const formattedPath = formatPathWithNames(issue.path, data);
    const prefix = formattedPath ? `${formattedPath}: ` : '';
    return `${prefix}${issue.message}`;
  });
}

/**
 * Convert numeric array indices to named fields where possible
 */
function formatPathWithNames(path: (string | number)[], data: unknown): string {
  if (path.length === 0) return '';

  let current: unknown = data;
  const parts: string[] = [];

  for (let i = 0; i < path.length; i++) {
    const segment = path[i];

    if (typeof segment === 'number' && Array.isArray(current)) {
      // Handle array index
      const item = current[segment];
      const prevSegment = i > 0 ? path[i - 1] : null;

      if (prevSegment === 'dimensions' && item && typeof item === 'object' && 'name' in item) {
        parts.push(`dimension '${(item as { name: string }).name}'`);
        current = item;
      } else if (prevSegment === 'measures' && item && typeof item === 'object' && 'name' in item) {
        parts.push(`measure '${(item as { name: string }).name}'`);
        current = item;
      } else if (prevSegment === 'metrics' && item && typeof item === 'object' && 'name' in item) {
        parts.push(`metric '${(item as { name: string }).name}'`);
        current = item;
      } else if (prevSegment === 'filters' && item && typeof item === 'object' && 'name' in item) {
        parts.push(`filter '${(item as { name: string }).name}'`);
        current = item;
      } else if (
        prevSegment === 'relationships' &&
        item &&
        typeof item === 'object' &&
        'name' in item
      ) {
        parts.push(`relationship '${(item as { name: string }).name}'`);
        current = item;
      } else if (prevSegment === 'options') {
        parts.push(`option ${segment + 1}`);
        current = item;
      } else {
        parts.push(`[${segment}]`);
        current = item;
      }
    } else if (typeof segment === 'string') {
      // Skip redundant field names after we've already identified the item
      if (
        i > 0 &&
        parts[parts.length - 1]?.includes(`'`) &&
        (segment === 'name' || segment === 'type' || segment === 'description')
      ) {
        // Don't add field name if we already have the item name
        parts.push(segment);
      } else if (
        segment === 'dimensions' ||
        segment === 'measures' ||
        segment === 'metrics' ||
        segment === 'filters' ||
        segment === 'relationships'
      ) {
        // Skip these as they'll be handled by the array index
        if (i === path.length - 1) {
          parts.push(segment);
        }
      } else {
        parts.push(segment);
      }
      current =
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[segment]
          : undefined;
    } else {
      parts.push(String(segment));
      if (current && typeof current === 'object' && segment !== undefined && segment in current) {
        current = current[segment as keyof typeof current];
      } else {
        current = undefined;
      }
    }
  }

  // Clean up the path by joining with dots but handling special cases
  let result = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const prevPart = i > 0 ? parts[i - 1] : undefined;

    if (!part) continue;

    if (i === 0) {
      result = part;
    } else if (part.startsWith('[') || part.startsWith('option ') || part.includes(`'`)) {
      // These are already formatted
      if (prevPart?.includes(`'`)) {
        result += `.${part}`;
      } else {
        result += result ? `.${part}` : part;
      }
    } else {
      result += `.${part}`;
    }
  }

  return result;
}
