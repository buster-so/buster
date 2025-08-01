import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';

const rgSearchInputSchema = z.object({
  pattern: z.string().describe('The regex pattern to search for in file contents'),
  path: z
    .string()
    .optional()
    .describe('The directory to search in. Defaults to current working directory'),
  include: z
    .string()
    .optional()
    .describe('File pattern to include in the search (e.g. "*.js", "*.{ts,tsx}")'),
  flags: z
    .object({
      caseInsensitive: z.boolean().optional().describe('Case insensitive search (-i flag)'),
      wholeWord: z.boolean().optional().describe('Match whole words only (-w flag)'),
      fixedString: z.boolean().optional().describe('Treat pattern as literal string (-F flag)'),
      invertMatch: z.boolean().optional().describe('Show lines that do NOT match (-v flag)'),
      maxCount: z.number().optional().describe('Maximum matches per file (-m flag)'),
      json: z.boolean().optional().describe('Output in JSON format (--json flag)'),
      filesWithMatches: z
        .boolean()
        .optional()
        .describe('Only show filenames with matches (-l flag)'),
      count: z.boolean().optional().describe('Only show match counts (-c flag)'),
    })
    .optional()
    .describe('Optional flags to modify search behavior'),
});

const rgSearchOutputSchema = z.object({
  title: z.string().describe('Search pattern used'),
  metadata: z.object({
    matches: z.number().describe('Number of matches found'),
    truncated: z.boolean().describe('Whether results were truncated'),
  }),
  output: z.string().describe('Formatted search results'),
});

export type RgSearchInput = z.infer<typeof rgSearchInputSchema>;
export type RgSearchOutput = z.infer<typeof rgSearchOutputSchema>;

interface FileMatch {
  path: string;
  lineNum: number;
  lineText: string;
}

const rgSearchExecution = wrapTraced(
  async (
    params: z.infer<typeof rgSearchInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof rgSearchOutputSchema>> => {
    const { pattern, path: searchPath, include, flags } = params;

    if (!pattern) {
      throw new Error('pattern is required');
    }

    try {
      const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

      if (!sandbox) {
        throw new Error('Ripgrep search requires sandbox environment');
      }

      // Build ripgrep command with flags
      const args: string[] = [];

      // Add optional flags
      if (flags?.caseInsensitive) args.push('-i');
      if (flags?.wholeWord) args.push('-w');
      if (flags?.fixedString) args.push('-F');
      if (flags?.invertMatch) args.push('-v');
      if (flags?.maxCount) args.push('-m', flags.maxCount.toString());

      // Handle special output modes
      const userRequestedJson = flags?.json;
      const userRequestedFilesList = flags?.filesWithMatches;
      const userRequestedCount = flags?.count;

      if (userRequestedJson) {
        args.push('--json');
      } else if (userRequestedFilesList) {
        args.push('-l');
      } else if (userRequestedCount) {
        args.push('-c');
      } else {
        // For standard searches, use JSON internally for reliable parsing
        args.push('--json');
      }

      // Always use color never
      args.push('--color', 'never');

      // Add the pattern
      args.push(pattern);

      // Add include glob if specified
      if (include) {
        args.push('--glob', include);
      }

      // Add search path (default to current directory)
      const targetPath = searchPath || '.';
      args.push(targetPath);

      // Build the full command
      const command = `rg ${args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ')}`;

      console.info(`[grep-search-tool] Executing command: ${command}`);

      // Execute the command
      const result = await sandbox.process.executeCommand(command);

      console.info(`[grep-search-tool] Command result:`, {
        command,
        exitCode: result.exitCode,
        hasResult: !!result.result,
        resultLength: result.result?.length || 0,
        resultPreview: result.result ? `${result.result.substring(0, 100)}...` : 'empty',
      });

      const output = (result.result || '').trim();

      // Exit code 1 means no matches found (not an error)
      // Exit code 2 typically means file/directory not found
      if (result.exitCode === 1 || result.exitCode === 2 || output === '') {
        return {
          title: pattern,
          metadata: { matches: 0, truncated: false },
          output: 'No matches found',
        };
      }

      if (result.exitCode !== 0) {
        throw new Error(`ripgrep failed with exit code ${result.exitCode}`);
      }

      // Special handling for user-requested output modes
      if (userRequestedJson || userRequestedFilesList || userRequestedCount) {
        // For these modes, just return the raw output
        const lines = output.split('\n').filter((line) => line);
        return {
          title: pattern,
          metadata: { matches: lines.length, truncated: false },
          output: output,
        };
      }

      // Parse JSON output for standard searches
      const lines = output.split('\n').filter((line) => line);
      const matches: FileMatch[] = [];

      for (const line of lines) {
        try {
          const json = JSON.parse(line);

          // Skip non-match entries (begin, end, summary)
          if (json.type !== 'match') continue;

          const data = json.data;
          if (!data) continue;

          // Extract match information
          const filePath = data.path?.text;
          const lineNumber = data.line_number;
          const lineText = data.lines?.text?.trim();

          if (filePath && lineNumber && lineText) {
            matches.push({
              path: filePath,
              lineNum: lineNumber,
              lineText: lineText,
            });
          }
        } catch (_e) {
          // Skip lines that aren't valid JSON
          console.warn('[grep-search-tool] Failed to parse JSON line:', line);
        }
      }

      // Sort matches by file path for consistent ordering
      matches.sort((a, b) => a.path.localeCompare(b.path));

      // Apply result limit
      const limit = 100;
      const truncated = matches.length > limit;
      const finalMatches = truncated ? matches.slice(0, limit) : matches;

      if (finalMatches.length === 0) {
        return {
          title: pattern,
          metadata: { matches: 0, truncated: false },
          output: 'No matches found',
        };
      }

      // Format output
      const outputLines = [`Found ${finalMatches.length} matches`];

      let currentFile = '';
      for (const match of finalMatches) {
        if (currentFile !== match.path) {
          if (currentFile !== '') {
            outputLines.push('');
          }
          currentFile = match.path;
          outputLines.push(`${match.path}:`);
        }
        outputLines.push(`  Line ${match.lineNum}: ${match.lineText}`);
      }

      if (truncated) {
        outputLines.push('');
        outputLines.push(
          '(Results are truncated. Consider using a more specific path or pattern.)'
        );
      }

      return {
        title: pattern,
        metadata: {
          matches: finalMatches.length,
          truncated,
        },
        output: outputLines.join('\n'),
      };
    } catch (error) {
      throw new Error(
        `Grep search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'rg-search' }
);

export const grepSearch = createTool({
  id: 'grep_search',
  description: `Search files and directories using ripgrep (rg) with structured parameters. Supports regex patterns, file filtering, and various search options. Returns formatted results with file paths, line numbers, and matching text.

Key features:
- Pattern-based search with regex support
- File type filtering with glob patterns (e.g., "*.js", "*.{ts,tsx}")
- Case-insensitive, whole word, and inverted matching options
- Results sorted alphabetically by file path
- Automatic result truncation at 100 matches`,
  inputSchema: rgSearchInputSchema,
  outputSchema: rgSearchOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof rgSearchInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await rgSearchExecution(context, runtimeContext);
  },
});

export default grepSearch;
