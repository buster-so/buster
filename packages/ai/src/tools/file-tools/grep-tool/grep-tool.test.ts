import { wrapTraced } from 'braintrust';
import type { GrepToolContext, GrepToolInput, GrepToolOutput } from './grep-tool';

const DEFAULT_LIMIT = 100;
const MAX_CHARS_PER_LINE = 2000;

interface Match {
  path: string;
  lineNum: number;
  lineText: string;
  lineTruncated: boolean;
  modTime: number;
}

/**
 * Executes ripgrep search using Bun.spawn
 * @param pattern - The regex pattern to search for
 * @param searchPath - The directory to search in
 * @param glob - Optional file pattern filter
 * @returns Array of matches with file info
 */
async function executeRipgrep(
  pattern: string,
  searchPath: string,
  glob?: string
): Promise<Match[]> {
  // Build ripgrep arguments
  const args = ['-n', pattern];

  if (glob) {
    args.push('--glob', glob);
  }

  args.push(searchPath);

  // Execute ripgrep using Bun.spawn
  const proc = Bun.spawn(['rg', ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const output = await new Response(proc.stdout).text();
  const errorOutput = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  // Exit code 1 means no matches found (not an error)
  if (exitCode === 1) {
    return [];
  }

  // Exit code 0 means success
  if (exitCode !== 0) {
    throw new Error(`ripgrep failed: ${errorOutput}`);
  }

  // Parse ripgrep output
  const lines = output.trim().split('\n');
  const matches: Match[] = [];

  for (const line of lines) {
    if (!line) continue;

    // Parse format: file_path:line_number:line_text
    const [filePath, lineNumStr, ...lineTextParts] = line.split(':');
    if (!filePath || !lineNumStr || lineTextParts.length === 0) continue;

    const lineNum = Number.parseInt(lineNumStr, 10);
    let lineText = lineTextParts.join(':');

    // Truncate line if it exceeds character limit
    let lineTruncated = false;
    if (lineText.length > MAX_CHARS_PER_LINE) {
      lineTruncated = true;
      lineText = `${lineText.slice(0, MAX_CHARS_PER_LINE)}... (line truncated)`;
    }

    // Get file modification time
    const file = Bun.file(filePath);
    const stats = await file.stat().catch(() => null);
    if (!stats) continue;

    matches.push({
      path: filePath,
      lineNum,
      lineText,
      lineTruncated,
      modTime: stats.mtime.getTime(),
    });
  }

  return matches;
}

/**
 * Creates the execute function for the grep search tool
 * @param context - The tool context containing messageId and project directory
 * @returns The execute function
 */
export function createGrepSearchToolExecute(context: GrepToolContext) {
  return wrapTraced(
    async function execute(input: GrepToolInput): Promise<GrepToolOutput> {
      const { messageId, projectDirectory, onToolEvent } = context;
      const { pattern, path, glob, offset = 0, limit = DEFAULT_LIMIT } = input;

      if (!pattern) {
        throw new Error('pattern is required');
      }

      const searchPath = path || projectDirectory;

      console.info(
        `Searching for pattern "${pattern}" in ${searchPath} (offset: ${offset}, limit: ${limit}) for message ${messageId}`
      );

      // Emit start event
      onToolEvent?.({
        tool: 'grepTool',
        event: 'start',
        args: input,
      });

      try {
        // Execute ripgrep
        const matches = await executeRipgrep(pattern, searchPath, glob);

        // Sort by modification time (newest first)
        matches.sort((a, b) => b.modTime - a.modTime);

        // Apply offset and limit
        const totalMatches = matches.length;
        const endIndex = Math.min(offset + limit, totalMatches);
        const finalMatches = matches.slice(offset, endIndex);
        const truncated = endIndex < totalMatches;

        console.info(
          `Search complete: ${finalMatches.length} matches found${truncated ? ' (truncated)' : ''}`
        );

        const result = {
          pattern,
          matches: finalMatches,
          totalMatches: finalMatches.length,
          truncated,
        };

        // Emit complete event
        onToolEvent?.({
          tool: 'grepTool',
          event: 'complete',
          result,
          args: input,
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Grep search failed:`, errorMessage);

        // Return empty results on error
        const result = {
          pattern,
          matches: [],
          totalMatches: 0,
          truncated: false,
        };

        // Emit complete event even on error
        onToolEvent?.({
          tool: 'grepTool',
          event: 'complete',
          result,
          args: input,
        });

        return result;
      }
    },
    { name: 'grep-execute' }
  );
}
