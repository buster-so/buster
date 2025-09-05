import type { PostgresError } from 'postgres';

export interface ParsedDatabaseError {
  type: 'foreign_key' | 'unique' | 'not_null' | 'check' | 'unknown';
  message: string;
  detail?: string;
  hint?: string;
  constraint?: string;
  table?: string;
  column?: string;
  originalError: Error;
}

/**
 * Parse PostgreSQL errors into structured, actionable error information
 */
export function parseDatabaseError(error: unknown): ParsedDatabaseError {
  // Handle postgres library errors
  if (isPostgresError(error)) {
    return parsePostgresError(error);
  }

  // Handle generic errors
  if (error instanceof Error) {
    return parseGenericError(error);
  }

  return {
    type: 'unknown',
    message: 'Unknown database error',
    originalError: new Error(String(error)),
  };
}

/**
 * Type guard for PostgresError
 */
function isPostgresError(error: unknown): error is PostgresError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Parse postgres library specific errors
 */
function parsePostgresError(error: PostgresError): ParsedDatabaseError {
  const base: ParsedDatabaseError = {
    type: 'unknown',
    message: error.message || 'Database error',
    originalError: error as Error,
  };

  // Add optional fields only if they exist
  if (error.detail) base.detail = error.detail;
  if (error.hint) base.hint = error.hint;
  if (error.constraint_name) base.constraint = error.constraint_name;
  if (error.table_name) base.table = error.table_name;
  if (error.column_name) base.column = error.column_name;

  // Parse by PostgreSQL error code
  // See: https://www.postgresql.org/docs/current/errcodes-appendix.html
  switch (error.code) {
    case '23503': // foreign_key_violation
      base.type = 'foreign_key';
      base.message = formatForeignKeyError(error);
      break;

    case '23505': // unique_violation
      base.type = 'unique';
      base.message = formatUniqueError(error);
      break;

    case '23502': // not_null_violation
      base.type = 'not_null';
      base.message = formatNotNullError(error);
      break;

    case '23514': // check_violation
      base.type = 'check';
      base.message = formatCheckError(error);
      break;

    default:
      // Keep original message for unknown codes
      break;
  }

  return base;
}

/**
 * Parse generic Error objects (fallback)
 */
function parseGenericError(error: Error): ParsedDatabaseError {
  const message = error.message.toLowerCase();

  // Try to detect error type from message
  let type: ParsedDatabaseError['type'] = 'unknown';
  let parsedMessage = error.message;

  if (message.includes('foreign key')) {
    type = 'foreign_key';
    parsedMessage = 'Foreign key constraint violation';
  } else if (message.includes('unique')) {
    type = 'unique';
    parsedMessage = 'Unique constraint violation';
  } else if (message.includes('not null') || message.includes('null value')) {
    type = 'not_null';
    parsedMessage = 'Required field is missing';
  } else if (message.includes('check constraint')) {
    type = 'check';
    parsedMessage = 'Check constraint violation';
  }

  return {
    type,
    message: parsedMessage,
    originalError: error,
  };
}

/**
 * Format foreign key violation error
 */
function formatForeignKeyError(error: PostgresError): string {
  if (error.detail) {
    // Extract the referenced value from detail
    // Example: Key (data_source_id)=(xxx) is not present in table "data_sources"
    const match = error.detail.match(
      /Key \(([^)]+)\)=\(([^)]+)\) is not present in table "([^"]+)"/
    );
    if (match) {
      const [, column, _value, table] = match;
      if (table === 'data_sources' || column === 'data_source_id') {
        return `Data source not found. Ensure the data source exists and you have access to it.`;
      }
      return `Referenced ${table} not found for ${column}`;
    }
  }

  return error.constraint_name
    ? `Foreign key constraint '${error.constraint_name}' violated`
    : 'Foreign key constraint violation - referenced record does not exist';
}

/**
 * Format unique constraint violation error
 */
function formatUniqueError(error: PostgresError): string {
  if (error.detail) {
    // Extract the duplicate value
    // Example: Key (name, data_source_id)=(xxx, yyy) already exists
    const match = error.detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
    if (match) {
      const [, columns] = match;
      if (columns?.includes('name')) {
        return 'A model with this name already exists in this data source';
      }
    }
  }

  return error.constraint_name
    ? `Unique constraint '${error.constraint_name}' violated - duplicate value`
    : 'Duplicate value - this record already exists';
}

/**
 * Format not null violation error
 */
function formatNotNullError(error: PostgresError): string {
  if (error.column_name) {
    const column = error.column_name;
    // Provide user-friendly names for common columns
    const friendlyNames: Record<string, string> = {
      data_source_id: 'data source',
      organization_id: 'organization',
      user_id: 'user',
      name: 'model name',
      schema: 'schema name',
      database_name: 'database name',
    };

    const fieldName = friendlyNames[column] || column;
    return `Required field '${fieldName}' is missing`;
  }

  return 'Required field is missing';
}

/**
 * Format check constraint violation error
 */
function formatCheckError(error: PostgresError): string {
  if (error.constraint_name) {
    // Try to provide user-friendly messages for known constraints
    const constraint = error.constraint_name;
    if (constraint.includes('name')) {
      return 'Model name does not meet requirements';
    }
    if (constraint.includes('type')) {
      return 'Invalid model type specified';
    }
    return `Validation failed for constraint '${constraint}'`;
  }

  return 'Data validation failed';
}

/**
 * Get actionable hint for database error
 */
export function getErrorHint(error: ParsedDatabaseError): string | undefined {
  switch (error.type) {
    case 'foreign_key':
      if (error.message.includes('data source')) {
        return "Run 'buster datasource list' to see available data sources";
      }
      return 'Ensure the referenced record exists and you have access to it';

    case 'unique':
      return 'Use a different name or update the existing model';

    case 'not_null':
      return 'Ensure all required fields are provided in your YAML configuration';

    case 'check':
      return 'Review the data format and validation requirements';

    default:
      return undefined;
  }
}
