import { relative, resolve } from 'node:path';
import { glob } from 'fast-glob';
import micromatch from 'micromatch';
import type { DeploymentExcluded, ResolvedConfig } from '../schemas';

/**
 * Discover YAML model files based on configuration
 * Uses fast-glob for efficient file discovery
 * @param config - The resolved configuration with include patterns
 * @param baseDir - The directory where buster.yml is located (paths are relative to this)
 */
export async function discoverModelFiles(
  config: ResolvedConfig,
  baseDir: string
): Promise<string[]> {
  // Resolve include patterns relative to the buster.yml location
  const patterns = config.include.map((pattern) => {
    // If pattern is absolute, use it directly
    if (pattern.startsWith('/')) {
      return pattern;
    }
    // Otherwise, resolve relative to the buster.yml directory
    return resolve(baseDir, pattern);
  });

  console.info(`  Searching from base directory: ${baseDir}`);
  if (config.include.length > 0) {
    console.info(`  Include patterns: ${config.include.join(', ')}`);
  }

  // Find all files matching the include patterns
  const files = await glob(patterns, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
    absolute: true,
    unique: true,
    cwd: baseDir, // Set the working directory for glob patterns
  });

  return files.sort(); // Sort for consistent ordering
}

/**
 * Filter model files based on exclusion patterns
 * Returns both included files and excluded files with reasons
 * @param files - Absolute paths to files discovered
 * @param excludePatterns - Exclusion patterns from config (relative to buster.yml)
 * @param baseDir - The directory where buster.yml is located
 */
export async function filterModelFiles(
  files: string[],
  excludePatterns: string[],
  baseDir: string
): Promise<{
  included: string[];
  excluded: DeploymentExcluded[];
}> {
  const included: string[] = [];
  const excluded: DeploymentExcluded[] = [];

  for (const file of files) {
    // Get path relative to the buster.yml directory for pattern matching
    const relativePath = relative(baseDir, file);

    // Always exclude buster.yml and buster.yaml files
    const baseName = relativePath.split('/').pop();
    if (baseName === 'buster.yml' || baseName === 'buster.yaml') {
      excluded.push({
        file: relativePath,
        reason: 'buster.yml/buster.yaml files are configuration files, not models',
      });
      continue;
    }

    // Check if file matches any exclusion pattern
    const matchedPattern =
      excludePatterns.length > 0 ? findMatchingPattern(relativePath, excludePatterns) : null;

    if (matchedPattern) {
      excluded.push({
        file: relativePath,
        reason: `Matched exclusion pattern: ${matchedPattern}`,
      });
    } else {
      included.push(file);
    }
  }

  return { included, excluded };
}

/**
 * Find the first exclusion pattern that matches a file path
 */
function findMatchingPattern(filePath: string, patterns: string[]): string | null {
  for (const pattern of patterns) {
    if (micromatch.isMatch(filePath, pattern)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Count total models that will be processed
 * Useful for progress tracking
 */
export async function countModelsInFiles(files: string[]): Promise<number> {
  // This is a simple estimate - assumes 1 model per file
  // The actual parsing will determine the real count
  return files.length;
}
