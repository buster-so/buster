import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { wrapTraced } from 'braintrust';
import { minimatch } from 'minimatch';
import type { GlobToolContext, GlobToolInput, GlobToolOutput } from './glob-tool';

const DEFAULT_LIMIT = 100;

interface Match {
  path: string;
  modTime: number;
}

/**
 * Recursively walk directory and find files matching the pattern
 */
async function walkDirectory(
  dir: string,
  pattern: string,
  basePath: string,
  matches: Match[]
): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        await walkDirectory(fullPath, pattern, basePath, matches);
      } else if (entry.isFile()) {
        // Check if file matches pattern
        if (minimatch(relativePath, pattern) || minimatch(entry.name, pattern)) {
          try {
            const stats = await stat(fullPath);
            matches.push({
              path: fullPath,
              modTime: stats.mtime.getTime(),
            });
          } catch (error) {
            // Skip files we can't stat
            console.warn(`Could not stat file ${fullPath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
    console.warn(`Could not read directory ${dir}:`, error);
  }
}

/**
 * Executes glob pattern matching to find files
 * @param pattern - The glob pattern to match
 * @param searchPath - The directory to search in
 * @returns Array of matching file paths with metadata
 */
async function executeGlob(pattern: string, searchPath: string): Promise<Match[]> {
  const matches: Match[] = [];
  await walkDirectory(searchPath, pattern, searchPath, matches);
  return matches;
}

/**
 * Creates the execute function for the glob tool
 * @param context - The tool context containing messageId and project directory
 * @returns The execute function
 */
export function createGlobToolExecute(context: GlobToolContext) {
  return wrapTraced(
    async function execute(input: GlobToolInput): Promise<GlobToolOutput> {
      const { messageId, onToolEvent } = context;
      const { pattern, path: inputPath, offset = 0, limit = DEFAULT_LIMIT } = input;
      const projectDirectory = process.cwd();

      if (!pattern) {
        throw new Error('pattern is required');
      }

      const searchPath = inputPath ? path.resolve(projectDirectory, inputPath) : projectDirectory;

      console.info(
        `Searching for pattern "${pattern}" in ${searchPath} (offset: ${offset}, limit: ${limit}) for message ${messageId}`
      );

      // Emit start event
      onToolEvent?.({
        tool: 'globTool',
        event: 'start',
        args: input,
      });

      try {
        // Execute glob search
        const matches = await executeGlob(pattern, searchPath);

        // Sort by modification time (newest first)
        matches.sort((a, b) => b.modTime - a.modTime);

        // Apply offset and limit
        const totalMatches = matches.length;
        const endIndex = Math.min(offset + limit, totalMatches);
        const finalMatches = matches.slice(offset, endIndex);
        const truncated = endIndex < totalMatches;

        console.info(
          `Glob search complete: ${finalMatches.length} files found${truncated ? ' (truncated)' : ''}`
        );

        const result = {
          pattern,
          matches: finalMatches,
          totalMatches: finalMatches.length,
          truncated,
        };

        // Emit complete event
        onToolEvent?.({
          tool: 'globTool',
          event: 'complete',
          result,
          args: input,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Glob search failed:`, errorMessage);

        // Return empty results on error
        const result = {
          pattern,
          matches: [],
          totalMatches: 0,
          truncated: false,
        };

        // Emit complete event even on error
        onToolEvent?.({
          tool: 'globTool',
          event: 'complete',
          result,
          args: input,
        });

        return result;
      }
    },
    { name: 'glob-execute' }
  );
}
