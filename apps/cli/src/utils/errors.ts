export class CLIError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CLIError';
  }
}

export class ApiError extends CLIError {
  constructor(public status: number, message: string) {
    super(message, 'API_ERROR');
    this.name = 'ApiError';
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConfigError extends CLIError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class FileSystemError extends CLIError {
  constructor(message: string) {
    super(message, 'FS_ERROR');
    this.name = 'FileSystemError';
  }
}