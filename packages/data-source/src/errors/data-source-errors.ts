/**
 * Base error class for all data source related errors
 */
export abstract class DataSourceError extends Error {
  abstract readonly code: string;
  abstract readonly isRetryable: boolean;

  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Generic connection pool error
 */
export class ConnectionPoolError extends DataSourceError {
  readonly code = 'CONNECTION_POOL_ERROR';
  readonly isRetryable = true;

  constructor(message: string, originalError?: Error) {
    super(`Connection pool error: ${message}`, originalError);
  }
}

/**
 * Connection acquisition timeout
 */
export class ConnectionAcquisitionTimeoutError extends DataSourceError {
  readonly code = 'CONNECTION_ACQUISITION_TIMEOUT';
  readonly isRetryable = true;

  constructor(timeout: number, originalError?: Error) {
    super(`Failed to acquire connection within ${timeout}ms`, originalError);
  }
}

/**
 * Connection pool exhausted
 */
export class ConnectionPoolExhaustedError extends DataSourceError {
  readonly code = 'CONNECTION_POOL_EXHAUSTED';
  readonly isRetryable = true;

  constructor(maxConnections: number, originalError?: Error) {
    super(`Connection pool exhausted (max: ${maxConnections})`, originalError);
  }
}

/**
 * Query execution errors
 */
export class QueryExecutionError extends DataSourceError {
  readonly code = 'QUERY_EXECUTION_ERROR';
  readonly isRetryable = false;

  constructor(
    message: string,
    public readonly sql?: string,
    originalError?: Error
  ) {
    super(`Query execution failed: ${message}`, originalError);
  }
}

/**
 * Query timeout error
 */
export class QueryTimeoutError extends DataSourceError {
  readonly code = 'QUERY_TIMEOUT';
  readonly isRetryable = true;

  constructor(
    timeout: number,
    public readonly sql?: string,
    originalError?: Error
  ) {
    super(`Query timeout after ${timeout}ms`, originalError);
  }
}

/**
 * Query cancellation error
 */
export class QueryCancellationError extends DataSourceError {
  readonly code = 'QUERY_CANCELLATION';
  readonly isRetryable = false;

  constructor(
    public readonly sql?: string,
    originalError?: Error
  ) {
    super('Query was cancelled', originalError);
  }
}

/**
 * Cancellation timeout error
 */
export class CancellationTimeoutError extends DataSourceError {
  readonly code = 'CANCELLATION_TIMEOUT';
  readonly isRetryable = false;

  constructor(
    timeout: number,
    public readonly sql?: string,
    originalError?: Error
  ) {
    super(`Query cancellation timed out after ${timeout}ms`, originalError);
  }
}

/**
 * Cancellation failed error
 */
export class CancellationFailedError extends DataSourceError {
  readonly code = 'CANCELLATION_FAILED';
  readonly isRetryable = false;

  constructor(
    message: string,
    public readonly sql?: string,
    originalError?: Error
  ) {
    super(`Failed to cancel query: ${message}`, originalError);
  }
}

/**
 * Authentication/credential errors
 */
export class AuthenticationError extends DataSourceError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly isRetryable = false;

  constructor(message: string, originalError?: Error) {
    super(`Authentication failed: ${message}`, originalError);
  }
}

/**
 * Network/connection errors
 */
export class NetworkError extends DataSourceError {
  readonly code = 'NETWORK_ERROR';
  readonly isRetryable = true;

  constructor(message: string, originalError?: Error) {
    super(`Network error: ${message}`, originalError);
  }
}

/**
 * Data source configuration errors
 */
export class ConfigurationError extends DataSourceError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly isRetryable = false;

  constructor(message: string, originalError?: Error) {
    super(`Configuration error: ${message}`, originalError);
  }
}

/**
 * Helper function to classify errors and return appropriate DataSourceError
 */
export function classifyError(
  error: unknown,
  context?: { sql?: string; timeout?: number }
): DataSourceError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : new Error(String(error));

  // Connection pool errors
  if (errorMessage.includes('acquire connection') || errorMessage.includes('Connection pool')) {
    if (errorMessage.includes('timeout')) {
      return new ConnectionAcquisitionTimeoutError(context?.timeout || 30000, originalError);
    }
    if (errorMessage.includes('limit reached') || errorMessage.includes('exhausted')) {
      return new ConnectionPoolExhaustedError(10, originalError); // Default max connections
    }
    return new ConnectionPoolError(errorMessage, originalError);
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return new QueryTimeoutError(context?.timeout || 60000, context?.sql, originalError);
  }

  // Cancellation errors
  if (errorMessage.includes('cancel') || errorMessage.includes('Cancel')) {
    return new QueryCancellationError(context?.sql, originalError);
  }

  // Authentication errors
  if (
    errorMessage.includes('authentication') ||
    errorMessage.includes('Authentication') ||
    errorMessage.includes('Invalid username or password') ||
    errorMessage.includes('Access denied') ||
    errorMessage.includes('credentials')
  ) {
    return new AuthenticationError(errorMessage, originalError);
  }

  // Network errors
  if (
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('ENETUNREACH') ||
    errorMessage.includes('network') ||
    errorMessage.includes('Network')
  ) {
    return new NetworkError(errorMessage, originalError);
  }

  // Configuration errors
  if (
    errorMessage.includes('configuration') ||
    errorMessage.includes('Configuration') ||
    errorMessage.includes('Invalid') ||
    errorMessage.includes('not found')
  ) {
    return new ConfigurationError(errorMessage, originalError);
  }

  // Default to query execution error
  return new QueryExecutionError(errorMessage, context?.sql, originalError);
}

/**
 * Helper to determine if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof DataSourceError) {
    return error.isRetryable;
  }

  // Check for common retryable patterns
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('temporarily unavailable')
  );
}

/**
 * Format error for user-friendly display
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof DataSourceError) {
    switch (error.code) {
      case 'CONNECTION_POOL_ERROR':
      case 'CONNECTION_ACQUISITION_TIMEOUT':
      case 'CONNECTION_POOL_EXHAUSTED':
        return 'The database is currently experiencing high load. Please try again in a few moments.';

      case 'QUERY_TIMEOUT':
        return 'Your query took too long to execute. Try simplifying your query or reducing the data range.';

      case 'QUERY_CANCELLATION':
        return 'Your query was cancelled. You can try running it again.';

      case 'CANCELLATION_TIMEOUT':
        return 'The query cancellation timed out. The query may still be running on the database.';

      case 'CANCELLATION_FAILED':
        return 'Failed to cancel the query. The query may still be running on the database.';

      case 'AUTHENTICATION_ERROR':
        return 'Unable to authenticate with the database. Please check your credentials.';

      case 'NETWORK_ERROR':
        return 'Unable to connect to the database. Please check your network connection and try again.';

      case 'CONFIGURATION_ERROR':
        return 'The data source configuration is invalid. Please check your settings.';

      case 'QUERY_EXECUTION_ERROR':
        return 'There was an error executing your query. Please check your SQL syntax.';

      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
}
