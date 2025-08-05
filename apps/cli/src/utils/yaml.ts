import { promises as fs } from 'node:fs';
import yaml from 'js-yaml';
import type { z } from 'zod';
import { FileSystemError } from './errors.js';
import { validateWithSchema } from './validation.js';

export class YamlParsingError extends FileSystemError {
  constructor(message: string, public filePath: string, public cause?: unknown) {
    super(`${message}: ${filePath}`);
    this.name = 'YamlParsingError';
  }
}

export class YamlValidationError extends FileSystemError {
  constructor(
    message: string,
    public errors: z.ZodError['errors'],
    public filePath: string
  ) {
    const formattedErrors = errors
      .map(err => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    
    super(`${message} in ${filePath}\n${formattedErrors}`);
    this.name = 'YamlValidationError';
  }
}

export async function parseYaml(filePath: string): Promise<unknown> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.load(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new YamlParsingError('File not found', filePath, error);
    }
    if (error.name === 'YAMLException') {
      throw new YamlParsingError('Invalid YAML syntax', filePath, error);
    }
    throw new YamlParsingError('Failed to parse YAML file', filePath, error);
  }
}

export async function parseAndValidateYaml<T>(
  filePath: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const parsed = await parseYaml(filePath);
  
  try {
    return validateWithSchema(parsed, schema, filePath);
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      throw new YamlValidationError(
        'Invalid YAML structure',
        (error as any).errors,
        filePath
      );
    }
    throw error;
  }
}

export async function saveYaml<T>(
  filePath: string,
  data: T,
  schema?: z.ZodSchema<T>
): Promise<void> {
  // Validate before saving if schema provided
  if (schema) {
    validateWithSchema(data, schema, filePath);
  }
  
  const yamlContent = yaml.dump(data, {
    lineWidth: -1,
    quotingType: '"',
    noRefs: true,
  });
  
  try {
    await fs.writeFile(filePath, yamlContent, 'utf-8');
  } catch (error) {
    throw new FileSystemError(`Failed to write YAML file: ${filePath}`);
  }
}