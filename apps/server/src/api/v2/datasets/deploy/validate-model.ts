import type { DeployModel } from '@buster/server-shared';

/**
 * Validate a model before deployment
 * Pure function that returns validation errors
 */
export function validateModel(model: DeployModel): string[] {
  const errors: string[] = [];

  if (!model.name || model.name.trim().length === 0) {
    errors.push('Model name is required');
  }

  if (!model.data_source_name || model.data_source_name.trim().length === 0) {
    errors.push('Data source name is required');
  }

  if (!model.schema || model.schema.trim().length === 0) {
    errors.push('Schema is required');
  }

  if (!model.columns || model.columns.length === 0) {
    errors.push('Model must have at least one column');
  }

  // Validate column names are unique
  const columnNames = new Set<string>();
  for (const column of model.columns || []) {
    if (!column.name || column.name.trim().length === 0) {
      errors.push('Column name is required');
    } else if (columnNames.has(column.name)) {
      errors.push(`Duplicate column name: ${column.name}`);
    } else {
      columnNames.add(column.name);
    }
  }

  return errors;
}

/**
 * Check if a model is valid
 */
export function isModelValid(model: DeployModel): boolean {
  return validateModel(model).length === 0;
}
