import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

interface ReadFileParams {
  file_path?: string;
  file_paths?: string[];
  offset?: number;
  limit?: number;
}

interface ReadFileResult {
  content: string;
  files_read: number;
  total_lines?: number;
  truncated: boolean;
}

export const readFileTool = createTool({
  id: 'read-file',
  description: 'Reads files from the local filesystem with optional line offset and limit',
  inputSchema: z.union([
    z.object({
      file_path: z.string().describe('The absolute path to the file to read'),
      offset: z.number().optional().describe('The line number to start reading from'),
      limit: z.number().optional().describe('The number of lines to read (default: 2000)'),
    }),
    z.object({
      file_paths: z.array(z.string()).describe('Array of absolute file paths to read'),
      offset: z.number().optional().describe('The line number to start reading from'),
      limit: z.number().optional().describe('The number of lines to read (default: 2000)'),
    }),
  ]),
  outputSchema: z.object({
    content: z.string(),
    files_read: z.number(),
    total_lines: z.number().optional(),
    truncated: z.boolean(),
  }),
  execute: async ({ context }) => {
    return await readFiles(context as ReadFileParams);
  },
});

const readFiles = wrapTraced(
  async (params: ReadFileParams): Promise<ReadFileResult> => {
    const { file_path, file_paths, offset = 0, limit = 2000 } = params;

    // Determine which files to read
    const filesToRead = file_paths || (file_path ? [file_path] : []);

    if (filesToRead.length === 0) {
      throw new Error('Must provide either file_path or file_paths');
    }

    const results: string[] = [];
    let totalLines = 0;
    let truncated = false;

    for (const filePath of filesToRead) {
      try {
        const result = await readSingleFile(filePath, offset, limit, filesToRead.length > 1);
        results.push(result.content);
        totalLines += result.lineCount;
        truncated = truncated || result.truncated;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push(`Error reading ${filePath}: ${errorMessage}`);
      }
    }

    return {
      content: results.join('\n\n'),
      files_read: filesToRead.length,
      total_lines: totalLines,
      truncated,
    };
  },
  { name: 'read-file' }
);

async function readSingleFile(
  filePath: string,
  offset: number,
  limit: number,
  isMultiFile: boolean
): Promise<{ content: string; lineCount: number; truncated: boolean }> {
  // Security check - ensure path is absolute and safe
  validateFilePath(filePath);

  if (!existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath}`);
  }

  const stats = await stat(filePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${filePath}`);
  }

  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const totalLines = lines.length;

  const startIdx = Math.max(0, offset);
  const endIdx = Math.min(startIdx + limit, totalLines);
  const selectedLines = lines.slice(startIdx, endIdx);

  let result = '';

  // Add file header for multi-file view
  if (isMultiFile) {
    result += `==> ${filePath} <==\n`;
  }

  // Format with line numbers (cat -n style)
  for (let i = 0; i < selectedLines.length; i++) {
    const lineNumber = startIdx + i + 1;
    result += `${lineNumber.toString().padStart(6)} ${selectedLines[i]}\n`;
  }

  return {
    content: result,
    lineCount: selectedLines.length,
    truncated: endIdx < totalLines,
  };
}

function validateFilePath(filePath: string): void {
  // Ensure path is absolute
  if (!isAbsolute(filePath)) {
    throw new Error(`File path must be absolute: ${filePath}`);
  }

  // Resolve to absolute path and check for path traversal
  const resolvedPath = resolve(filePath);

  // Block access to sensitive system directories
  const blockedPaths = [
    '/etc/',
    '/var/log/',
    '/root/',
    '/home/',
    '/proc/',
    '/sys/',
  ];

  // Add user-specific sensitive paths if HOME is available
  if (process.env.HOME) {
    blockedPaths.push(
      `${process.env.HOME}/.ssh/`,
      `${process.env.HOME}/.aws/`
    );
  }

  for (const blocked of blockedPaths) {
    if (resolvedPath.startsWith(blocked)) {
      throw new Error(`Access denied to path: ${resolvedPath}`);
    }
  }

  // Ensure path doesn't contain traversal attempts
  if (filePath.includes('..') || filePath.includes('~')) {
    throw new Error(`Path traversal not allowed: ${filePath}`);
  }
}