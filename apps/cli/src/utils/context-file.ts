import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

/**
 * Reads a context file and returns its contents
 * Supports both absolute paths and paths relative to the working directory
 *
 * @param contextFilePath - Path to the context file (absolute or relative)
 * @param workingDirectory - Working directory for resolving relative paths
 * @returns The file contents as a string
 * @throws Error if file doesn't exist or can't be read
 */
export function readContextFile(contextFilePath: string, workingDirectory: string): string {
  // Resolve the full path
  const fullPath = isAbsolute(contextFilePath)
    ? contextFilePath
    : resolve(workingDirectory, contextFilePath);

  // Check if file exists
  if (!existsSync(fullPath)) {
    throw new Error(`Context file not found: ${fullPath}`);
  }

  // Read and return file contents
  try {
    return readFileSync(fullPath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to read context file: ${fullPath}. ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
