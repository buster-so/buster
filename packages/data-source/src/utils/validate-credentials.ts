import { type Credentials, DataSourceType } from '../types/credentials';

/**
 * Type guard to validate if an unknown object is valid Credentials
 * This provides runtime type safety when converting from Record<string, unknown>
 * to the Credentials union type
 */
export function isValidCredentials(obj: unknown): obj is Credentials {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const record = obj as Record<string, unknown>;

  // Check if type field exists and is valid
  if (!record.type || typeof record.type !== 'string') {
    return false;
  }

  // Validate based on the type
  switch (record.type) {
    case DataSourceType.Snowflake:
      return validateSnowflakeCredentials(record);
    case DataSourceType.BigQuery:
      return validateBigQueryCredentials(record);
    case DataSourceType.PostgreSQL:
      return validatePostgreSQLCredentials(record);
    case DataSourceType.MySQL:
      return validateMySQLCredentials(record);
    case DataSourceType.SQLServer:
      return validateSQLServerCredentials(record);
    case DataSourceType.Redshift:
      return validateRedshiftCredentials(record);
    default:
      return false;
  }
}

function validateSnowflakeCredentials(obj: Record<string, unknown>): boolean {
  return !!(
    obj.account_id &&
    typeof obj.account_id === 'string' &&
    obj.warehouse_id &&
    typeof obj.warehouse_id === 'string' &&
    obj.username &&
    typeof obj.username === 'string' &&
    obj.password &&
    typeof obj.password === 'string' &&
    obj.default_database &&
    typeof obj.default_database === 'string'
  );
}

function validateBigQueryCredentials(obj: Record<string, unknown>): boolean {
  return !!(
    obj.project_id &&
    typeof obj.project_id === 'string' &&
    (obj.service_account_key || obj.key_file_path)
  );
}

function validatePostgreSQLCredentials(obj: Record<string, unknown>): boolean {
  return !!(
    obj.host &&
    typeof obj.host === 'string' &&
    obj.default_database &&
    typeof obj.default_database === 'string' &&
    obj.username &&
    typeof obj.username === 'string' &&
    obj.password &&
    typeof obj.password === 'string'
  );
}

function validateMySQLCredentials(obj: Record<string, unknown>): boolean {
  return !!(
    obj.host &&
    typeof obj.host === 'string' &&
    obj.default_database &&
    typeof obj.default_database === 'string' &&
    obj.username &&
    typeof obj.username === 'string' &&
    obj.password &&
    typeof obj.password === 'string'
  );
}

function validateSQLServerCredentials(obj: Record<string, unknown>): boolean {
  return !!(
    obj.server &&
    typeof obj.server === 'string' &&
    obj.default_database &&
    typeof obj.default_database === 'string' &&
    obj.username &&
    typeof obj.username === 'string' &&
    obj.password &&
    typeof obj.password === 'string'
  );
}

function validateRedshiftCredentials(obj: Record<string, unknown>): boolean {
  return !!(
    obj.host &&
    typeof obj.host === 'string' &&
    obj.default_database &&
    typeof obj.default_database === 'string' &&
    obj.username &&
    typeof obj.username === 'string' &&
    obj.password &&
    typeof obj.password === 'string'
  );
}

/**
 * Safely converts a Record<string, unknown> to Credentials with validation
 * Throws a descriptive error if validation fails
 */
export function toCredentials(obj: Record<string, unknown>): Credentials {
  if (isValidCredentials(obj)) {
    return obj;
  }

  // Provide helpful error message about what's missing
  const type = obj.type as string | undefined;
  if (!type) {
    throw new Error('Credentials missing required "type" field');
  }

  // Type-specific error messages
  switch (type) {
    case DataSourceType.Snowflake:
      throw new Error(
        'Invalid Snowflake credentials: missing required fields (account_id, warehouse_id, username, password, default_database)'
      );
    case DataSourceType.BigQuery:
      throw new Error(
        'Invalid BigQuery credentials: missing required fields (project_id and either service_account_key or key_file_path)'
      );
    case DataSourceType.PostgreSQL:
      throw new Error(
        'Invalid PostgreSQL credentials: missing required fields (host, default_database, username, password)'
      );
    case DataSourceType.MySQL:
      throw new Error(
        'Invalid MySQL credentials: missing required fields (host, default_database, username, password)'
      );
    case DataSourceType.SQLServer:
      throw new Error(
        'Invalid SQL Server credentials: missing required fields (server, default_database, username, password)'
      );
    case DataSourceType.Redshift:
      throw new Error(
        'Invalid Redshift credentials: missing required fields (host, default_database, username, password)'
      );
    default:
      throw new Error(`Unsupported data source type: ${type}`);
  }
}
