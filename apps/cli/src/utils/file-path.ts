import path from 'node:path';

/**
 * Get relative path from current working directory
 */
export function getRelativePath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath);
}
