/**
 * File Type Detection Utilities
 *
 * Detects whether a parsed YAML file is in Buster format, dbt format, or unknown.
 * This ensures proper routing to the appropriate parser while maintaining backward compatibility.
 */

export type FileType = 'buster' | 'dbt' | 'unknown';

/**
 * Detect the type of a parsed YAML file
 *
 * Detection logic:
 * - Buster format: Has 'name' at top level + 'dimensions' or 'measures' arrays
 * - dbt format: Has 'models' or 'semantic_models' arrays at top level
 * - Unknown: Anything else
 *
 * @param parsedYaml - The parsed YAML object to analyze
 * @returns The detected file type
 *
 * @example
 * ```typescript
 * const yaml = { name: "users", dimensions: [], measures: [] };
 * detectFileType(yaml); // Returns 'buster'
 *
 * const dbtYaml = { models: [{...}], semantic_models: [{...}] };
 * detectFileType(dbtYaml); // Returns 'dbt'
 * ```
 */
export function detectFileType(parsedYaml: unknown): FileType {
  // Guard against null, undefined, and non-objects
  if (!parsedYaml || typeof parsedYaml !== 'object') {
    return 'unknown';
  }

  const obj = parsedYaml as Record<string, unknown>;

  // Detect Buster format
  // Must have:
  // 1. 'name' field at top level (any type - validation will catch if it's not a string)
  // 2. Either 'dimensions' or 'measures' (any type - validation will catch if not arrays)
  // We're lenient here to allow detailed Zod validation errors for invalid files
  if ('name' in obj && ('dimensions' in obj || 'measures' in obj)) {
    return 'buster';
  }

  // Detect dbt format
  // Must have either 'models' or 'semantic_models' arrays
  if ('models' in obj || 'semantic_models' in obj) {
    return 'dbt';
  }

  // Unknown format
  return 'unknown';
}

/**
 * Check if a file type is valid (not unknown)
 *
 * @param fileType - The file type to check
 * @returns True if file type is buster or dbt
 */
export function isValidFileType(fileType: FileType): boolean {
  return fileType === 'buster' || fileType === 'dbt';
}

/**
 * Get a human-readable description of the file type
 *
 * @param fileType - The file type
 * @returns A description string
 */
export function getFileTypeDescription(fileType: FileType): string {
  switch (fileType) {
    case 'buster':
      return 'Buster YAML format';
    case 'dbt':
      return 'dbt metadata YAML format (models and/or semantic models)';
    case 'unknown':
      return 'Unknown format (expected Buster or dbt YAML structure)';
  }
}
