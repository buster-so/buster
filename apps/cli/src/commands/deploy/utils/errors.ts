import { ZodError } from 'zod';

/**
 * Error type definitions
 */
export interface ConfigurationError {
  name: 'ConfigurationError';
  message: string;
  path?: string;
}

export interface ModelValidationError {
  name: 'ModelValidationError';
  message: string;
  model: string;
  field?: string;
}

export interface DeploymentError {
  name: 'DeploymentError';
  message: string;
  model: string;
  response?: unknown;
}

/**
 * Deployment validation error class for backwards compatibility with tests
 */
export class DeploymentValidationError extends Error {
  public parseFailures: Array<{ file: string; error: string }>;
  public todoFiles: Array<{ file: string }>;
  public exitCode: number;

  constructor(
    message: string,
    parseFailures: Array<{ file: string; error: string }>,
    todoFiles: Array<{ file: string }>,
    exitCode = 1
  ) {
    super(message);
    this.name = 'DeploymentValidationError';
    this.parseFailures = parseFailures;
    this.todoFiles = todoFiles;
    this.exitCode = exitCode;
  }
}

export type DeployError =
  | ConfigurationError
  | ModelValidationError
  | DeploymentError
  | DeploymentValidationError
  | Error;

/**
 * Functional factory for configuration errors
 */
export function createConfigurationError(
  message: string,
  path?: string
): ConfigurationError & Error {
  const error = new Error(message) as ConfigurationError & Error;
  error.name = 'ConfigurationError';
  if (path) {
    error.path = path;
  }
  return error;
}

/**
 * Functional factory for model validation errors
 */
export function createModelValidationError(
  message: string,
  model: string,
  field?: string
): ModelValidationError & Error {
  const error = new Error(message) as ModelValidationError & Error;
  error.name = 'ModelValidationError';
  error.model = model;
  if (field) {
    error.field = field;
  }
  return error;
}

/**
 * Functional factory for deployment errors
 */
export function createDeploymentError(
  message: string,
  model: string,
  response?: unknown
): DeploymentError & Error {
  const error = new Error(message) as DeploymentError & Error;
  error.name = 'DeploymentError';
  error.model = model;
  error.response = response;
  return error;
}

/**
 * Functional factory for deployment validation errors (keeps same signature for existing code)
 */
export function createDeploymentValidationError(
  message: string,
  parseFailures: Array<{ file: string; error: string }>,
  todoFiles: Array<{ file: string }>,
  exitCode = 1
): DeploymentValidationError {
  return new DeploymentValidationError(message, parseFailures, todoFiles, exitCode);
}

/**
 * Type guard for ConfigurationError
 */
export function isConfigurationError(error: unknown): error is ConfigurationError & Error {
  return (
    error instanceof Error &&
    'name' in error &&
    (error as Error & { name: string }).name === 'ConfigurationError'
  );
}

/**
 * Type guard for ModelValidationError
 */
export function isModelValidationError(error: unknown): error is ModelValidationError & Error {
  return (
    error instanceof Error &&
    'name' in error &&
    (error as Error & { name: string }).name === 'ModelValidationError'
  );
}

/**
 * Type guard for DeploymentError
 */
export function isDeploymentError(error: unknown): error is DeploymentError & Error {
  return (
    error instanceof Error &&
    'name' in error &&
    (error as Error & { name: string }).name === 'DeploymentError'
  );
}

/**
 * Type guard for DeploymentValidationError
 */
export function isDeploymentValidationError(error: unknown): error is DeploymentValidationError {
  return error instanceof DeploymentValidationError;
}

/**
 * Format error messages with helpful context and suggestions
 */
export function formatDeployError(error: unknown): string {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `  • ${path}: ${issue.message}`;
      })
      .join('\n');

    return `Validation Error:\n${issues}\n\n💡 Check your YAML syntax and ensure all required fields are present.`;
  }

  // Handle configuration errors
  if (isConfigurationError(error)) {
    let message = `Configuration Error: ${error.message}`;
    if (error.path) {
      message += `\n  File: ${error.path}`;
    }
    message += '\n\n💡 Try:\n';
    message += '  1. Check that buster.yml exists and is valid YAML\n';
    message += '  2. Ensure all paths in the config are correct\n';
    message += '  3. Run "buster init" to create a new config';
    return message;
  }

  // Handle model validation errors
  if (isModelValidationError(error)) {
    let message = `Model Validation Error in ${error.model}: ${error.message}`;
    if (error.field) {
      message += `\n  Field: ${error.field}`;
    }
    message += '\n\n💡 Common fixes:\n';
    message += '  • Ensure model has a unique name\n';
    message += '  • Add at least one dimension or measure\n';
    message += '  • Check that all required fields are present';
    return message;
  }

  // Handle deployment errors
  if (isDeploymentError(error)) {
    let message = `Deployment Error for model ${error.model}: ${error.message}`;
    if (error.response) {
      message += `\n  API Response: ${JSON.stringify(error.response, null, 2)}`;
    }
    message += '\n\n💡 Try:\n';
    message += '  1. Check your authentication: buster auth\n';
    message += '  2. Verify the data source exists in Buster\n';
    message += '  3. Check that schema and database values are correct';
    return message;
  }

  // Handle deployment validation errors
  if (isDeploymentValidationError(error)) {
    let message = '';

    if (error.parseFailures.length > 0) {
      message += '\nValidation Errors:\n';
      for (const failure of error.parseFailures) {
        message += `  ✗ ${failure.file}: ${failure.error}\n`;
      }
    }

    if (error.todoFiles.length > 0) {
      message += '\nFiles with incomplete TODOs:\n';
      for (const todo of error.todoFiles) {
        message += `  ⚠ ${todo.file} - contains {{TODO}} markers\n`;
      }
    }

    message += '\n💡 Fix all errors and complete TODOs before deploying:\n';
    message += '  • Replace {{TODO}} markers with actual values\n';
    message += '  • Ensure all models have required fields\n';
    message += '  • Verify YAML syntax is correct\n';
    message += '  • Run with --dry-run to validate without deploying';
    return message;
  }

  // Handle authentication errors
  if (error instanceof Error && error.message.includes('401')) {
    return (
      'Authentication Error: Your API key is invalid or expired\n\n' +
      '💡 Run: buster auth\n' +
      '   to authenticate with your Buster account'
    );
  }

  // Handle network errors
  if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
    return (
      'Connection Error: Unable to connect to Buster API\n\n' +
      '💡 Try:\n' +
      '  1. Check your internet connection\n' +
      '  2. Verify the API URL is correct\n' +
      "  3. If using a local instance, ensure it's running"
    );
  }

  // Handle file not found errors
  if (error instanceof Error && error.message.includes('ENOENT')) {
    const match = error.message.match(/no such file or directory.*'(.+)'/);
    const file = match ? match[1] : 'unknown file';
    return `File Not Found: ${file}\n\n💡 Check that:\n  • The file path is correct\n  • You have permission to read the file\n  • The file exists in the specified location`;
  }

  // Handle permission errors
  if (error instanceof Error && error.message.includes('EACCES')) {
    return (
      'Permission Denied: Cannot access file or directory\n\n' +
      '💡 Try:\n' +
      '  • Check file permissions\n' +
      '  • Run with appropriate permissions\n' +
      '  • Ensure the directory is readable'
    );
  }

  // Handle YAML parsing errors
  if (error instanceof Error && error.message.includes('YAMLException')) {
    return `YAML Parsing Error: ${error.message}\n\n💡 Common YAML issues:\n  • Check indentation (use spaces, not tabs)\n  • Ensure proper syntax for lists and objects\n  • Verify all strings are properly quoted if needed\n  • Look for missing colons or dashes`;
  }

  // Generic error handling
  if (error instanceof Error) {
    return `Error: ${error.message}\n\n💡 For more help, run: buster --help`;
  }

  return `Unknown error occurred: ${String(error)}\n\n💡 Enable debug mode for more details:\n   export BUSTER_DEBUG=1`;
}

/**
 * Exit codes following Unix conventions
 */
export function getExitCode(error: unknown): number {
  if (error instanceof ZodError) {
    return 2; // Misuse of shell command
  }

  if (isConfigurationError(error)) {
    return 78; // Configuration error
  }

  if (isModelValidationError(error)) {
    return 65; // Data format error
  }

  if (isDeploymentError(error)) {
    return 75; // Temporary failure
  }

  if (isDeploymentValidationError(error)) {
    return error.exitCode; // Use the custom exit code (default 1)
  }

  if (error instanceof Error) {
    if (error.message.includes('401')) {
      return 77; // Permission denied
    }
    if (error.message.includes('ENOENT')) {
      return 66; // Cannot open input
    }
    if (error.message.includes('EACCES')) {
      return 77; // Permission denied
    }
    if (error.message.includes('ECONNREFUSED')) {
      return 68; // Host name unknown
    }
  }

  return 1; // General error
}
