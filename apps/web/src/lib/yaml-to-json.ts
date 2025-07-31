import { load, type LoadOptions } from 'js-yaml';

/**
 * Error thrown when YAML parsing fails
 */
export class YamlParseError extends Error {
  constructor(
    message: string,
    public readonly originalError: unknown
  ) {
    super(message);
    this.name = 'YamlParseError';
  }
}

/**
 * Options for YAML to JSON conversion
 */
export interface YamlToJsonOptions {
  /** Custom schema to use for parsing. Defaults to DEFAULT_SCHEMA */
  schema?: LoadOptions['schema'];
  /** Custom file name for error messages */
  filename?: string;
}

/**
 * Converts a YAML string to a JSON object with type safety
 *
 * @template T - The expected type of the parsed JSON object
 * @param yamlString - The YAML string to parse
 * @param options - Optional parsing configuration
 * @returns The parsed object typed as T
 * @throws {YamlParseError} When YAML parsing fails
 *
 * @example
 * ```typescript
 * interface Config {
 *   name: string;
 *   version: number;
 * }
 *
 * const yaml = `
 * name: "My App"
 * version: 1.0
 * `;
 *
 * const config = yamlToJson<Config>(yaml);
 * // config is now typed as Config
 * ```
 */
export function yamlToJson<T = unknown>(yamlString: string, options: YamlToJsonOptions = {}): T {
  // Handle edge cases
  if (typeof yamlString !== 'string') {
    throw new YamlParseError('Input must be a string', new TypeError('Expected string input'));
  }

  if (yamlString.trim() === '') {
    throw new YamlParseError('YAML string cannot be empty', new Error('Empty input'));
  }

  try {
    const loadOptions: LoadOptions = {
      schema: options.schema,
      filename: options.filename
    };

    const result = load(yamlString, loadOptions);

    // Ensure we got a valid result
    if (result === undefined) {
      throw new YamlParseError('YAML parsing resulted in undefined', new Error('Undefined result'));
    }

    return result as T;
  } catch (error) {
    if (error instanceof YamlParseError) {
      throw error;
    }

    // Wrap js-yaml errors with our custom error
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new YamlParseError(`Failed to parse YAML: ${errorMessage}`, error);
  }
}

/**
 * Type guard to check if a value is a valid JSON-serializable object
 * Useful for runtime validation after YAML parsing
 *
 * @param value - The value to check
 * @returns True if the value can be safely serialized to JSON
 */
export function isJsonSerializable(value: unknown): boolean {
  try {
    const result = JSON.stringify(value);
    // JSON.stringify returns undefined for undefined values, functions, symbols
    return result !== undefined;
  } catch {
    return false;
  }
}

/**
 * Safely converts YAML to JSON with additional validation
 *
 * @template T - The expected type of the parsed JSON object
 * @param yamlString - The YAML string to parse
 * @param options - Optional parsing configuration
 * @returns The parsed and validated object typed as T
 * @throws {YamlParseError} When YAML parsing or validation fails
 */
export function yamlToJsonSafe<T = unknown>(
  yamlString: string,
  options: YamlToJsonOptions = {}
): T {
  const result = yamlToJson<T>(yamlString, options);

  if (!isJsonSerializable(result)) {
    throw new YamlParseError(
      'Parsed YAML contains non-JSON-serializable values',
      new Error('Non-serializable content')
    );
  }

  return result;
}
