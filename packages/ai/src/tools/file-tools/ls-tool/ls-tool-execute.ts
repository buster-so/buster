import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { wrapTraced } from 'braintrust';
import type { LsToolContext, LsToolInput, LsToolOutput } from './ls-tool';

export const IGNORE_PATTERNS = [
  'node_modules/',
  '__pycache__/',
  '.git/',
  'dist/',
  'build/',
  'target/',
  'vendor/',
  'bin/',
  'obj/',
  '.idea/',
  '.vscode/',
  '.zig-cache/',
  'zig-out',
  '.coverage',
  'coverage/',
  'vendor/',
  'tmp/',
  'temp/',
  '.cache/',
  'cache/',
  'logs/',
  '.venv/',
  'venv/',
  'env/',
];

const DEFAULT_LIMIT = 100;

/**
 * Check if a path matches any of the ignore patterns
 */
function shouldIgnore(relativePath: string, ignorePatterns: string[]): boolean {
  const normalizedPath = relativePath.replace(/\\/g, '/');

  for (const pattern of ignorePatterns) {
    // Remove leading '!' if present (for consistency with glob patterns)
    const cleanPattern = pattern.startsWith('!') ? pattern.slice(1) : pattern;

    // Simple glob matching
    if (cleanPattern.endsWith('*')) {
      const prefix = cleanPattern.slice(0, -1);
      if (normalizedPath.startsWith(prefix)) {
        return true;
      }
    } else if (cleanPattern.endsWith('/')) {
      // Directory pattern
      const dirName = cleanPattern.slice(0, -1);
      if (normalizedPath === dirName || normalizedPath.startsWith(`${dirName}/`)) {
        return true;
      }
    } else {
      // Exact match
      if (normalizedPath === cleanPattern) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Recursively list files in a directory
 */
async function listFilesRecursive(
  dirPath: string,
  basePath: string,
  ignorePatterns: string[],
  files: string[],
  limit: number,
  currentDepth: number,
  maxDepth: number,
  unexpandedDirs: Set<string>
): Promise<void> {
  if (files.length >= limit) {
    return;
  }

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= limit) {
        break;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      // Check if should ignore
      if (shouldIgnore(relativePath, ignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Check if we've hit the depth limit
        if (currentDepth >= maxDepth) {
          unexpandedDirs.add(relativePath);
        } else {
          // Recurse into directory
          await listFilesRecursive(
            fullPath,
            basePath,
            ignorePatterns,
            files,
            limit,
            currentDepth + 1,
            maxDepth,
            unexpandedDirs
          );
        }
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
    console.warn(`Could not read directory ${dirPath}:`, error);
  }
}

/**
 * Render a directory tree structure
 */
function renderDir(
  dirPath: string,
  depth: number,
  dirs: Set<string>,
  filesByDir: Map<string, string[]>,
  unexpandedDirs: Set<string>
): string {
  const indent = '  '.repeat(depth);
  let output = '';

  if (depth > 0) {
    output += `${indent}${path.basename(dirPath)}/\n`;
  }

  const childIndent = '  '.repeat(depth + 1);
  const children = Array.from(dirs)
    .filter((d) => path.dirname(d) === dirPath && d !== dirPath)
    .sort();

  // Render subdirectories first
  for (const child of children) {
    output += renderDir(child, depth + 1, dirs, filesByDir, unexpandedDirs);
  }

  // Render files
  const files = filesByDir.get(dirPath) || [];
  for (const file of files.sort()) {
    output += `${childIndent}${file}\n`;
  }

  // Render unexpanded directories at this level
  const unexpandedAtThisLevel = Array.from(unexpandedDirs)
    .filter((d) => path.dirname(d) === dirPath)
    .sort();

  for (const unexpanded of unexpandedAtThisLevel) {
    output += `${childIndent}${path.basename(unexpanded)}/... (depth limit)\n`;
  }

  return output;
}

/**
 * Creates the execute function for the ls tool
 */
export function createLsToolExecute(context: LsToolContext) {
  return wrapTraced(
    async function execute(input: LsToolInput): Promise<LsToolOutput> {
      const { messageId, onToolEvent } = context;
      const projectDirectory = process.cwd();
      const searchPath = path.resolve(projectDirectory, input.path || projectDirectory);
      const offset = input.offset ?? 0;
      const limit = input.limit ?? DEFAULT_LIMIT;

      console.info(
        `Listing directory ${searchPath} (offset: ${offset}, limit: ${limit}) for message ${messageId}`
      );

      // Emit start event
      onToolEvent?.({
        tool: 'lsTool',
        event: 'start',
        args: input,
      });

      try {
        // Validate the path exists and is a directory
        const stats = await stat(searchPath);
        if (!stats.isDirectory()) {
          const result = {
            success: false,
            path: searchPath,
            output: '',
            count: 0,
            truncated: false,
            errorMessage: `Path is not a directory: ${searchPath}`,
          };

          // Emit complete event
          onToolEvent?.({
            tool: 'lsTool',
            event: 'complete',
            result,
            args: input,
          });

          return result;
        }

        // Build ignore patterns
        const ignorePatterns = [...IGNORE_PATTERNS, ...(input.ignore || [])];

        // Get depth limit (default to 3 if not specified)
        const maxDepth = input.depth ?? 3;

        // List files
        const allFiles: string[] = [];
        const unexpandedDirs = new Set<string>();
        // Collect offset + limit + 1 files to detect if there are more files (for truncation)
        await listFilesRecursive(
          searchPath,
          searchPath,
          ignorePatterns,
          allFiles,
          offset + limit + 1,
          0,
          maxDepth,
          unexpandedDirs
        );

        // Apply offset and limit
        const totalFiles = allFiles.length;
        const endIndex = Math.min(offset + limit, totalFiles);
        const files = allFiles.slice(offset, endIndex);

        // Build directory structure
        const dirs = new Set<string>();
        const filesByDir = new Map<string, string[]>();

        for (const file of files) {
          const dir = path.dirname(file);
          const parts = dir === '.' ? [] : dir.split(path.sep);

          // Add all parent directories
          for (let i = 0; i <= parts.length; i++) {
            const dirPath = i === 0 ? '.' : parts.slice(0, i).join('/');
            dirs.add(dirPath);
          }

          // Add file to its directory
          if (!filesByDir.has(dir)) {
            filesByDir.set(dir, []);
          }
          filesByDir.get(dir)?.push(path.basename(file));
        }

        // Render directory tree
        const output = `${searchPath}/\n${renderDir('.', 0, dirs, filesByDir, unexpandedDirs)}`;

        // If we collected more files than requested, there are more available
        const truncated = totalFiles > offset + limit;

        console.info(
          `Listed ${files.length} file(s) in ${searchPath}${truncated ? ' (truncated)' : ''}`
        );

        const result = {
          success: true,
          path: searchPath,
          output,
          count: files.length,
          truncated,
        };

        // Emit complete event
        onToolEvent?.({
          tool: 'lsTool',
          event: 'complete',
          result,
          args: input,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error listing directory ${searchPath}:`, errorMessage);

        const result = {
          success: false,
          path: searchPath,
          output: '',
          count: 0,
          truncated: false,
          errorMessage,
        };

        // Emit complete event even on error
        onToolEvent?.({
          tool: 'lsTool',
          event: 'complete',
          result,
          args: input,
        });

        return result;
      }
    },
    { name: 'ls-execute' }
  );
}
