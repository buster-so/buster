import { existsSync } from 'node:fs';
import type { Dirent, Stats } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { minimatch } from 'minimatch';
import { z } from 'zod';

interface LsParams {
  path?: string;
  all?: boolean;
  long?: boolean;
  human_readable?: boolean;
  sort_by?: 'name' | 'size' | 'modified' | 'created';
  reverse?: boolean;
  max_depth?: number;
  filter?: string;
}

interface FileItem {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  size_formatted: string;
  modified: string;
  permissions: string;
  is_hidden: boolean;
}

interface LsResult {
  path: string;
  total_items: number;
  items: FileItem[];
}

export const lsTool = createTool({
  id: 'ls-directory',
  description: 'List directory contents with detailed file information',
  inputSchema: z.object({
    path: z.string().default('.').describe('Directory path to list'),
    all: z.boolean().default(false).describe('Include hidden files'),
    long: z.boolean().default(true).describe('Use long listing format'),
    human_readable: z.boolean().default(true).describe('Human-readable sizes'),
    sort_by: z.enum(['name', 'size', 'modified', 'created']).default('name'),
    reverse: z.boolean().default(false).describe('Reverse sort order'),
    max_depth: z.number().default(1).describe('Maximum depth for recursive listing'),
    filter: z.string().optional().describe('Filter pattern (glob)'),
  }),
  outputSchema: z.object({
    path: z.string(),
    total_items: z.number(),
    items: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['file', 'directory', 'symlink']),
        size: z.number(),
        size_formatted: z.string(),
        modified: z.string(),
        permissions: z.string(),
        is_hidden: z.boolean(),
      })
    ),
  }),
  execute: async ({ context }) => {
    return await listDirectory(context as LsParams);
  },
});

const listDirectory = wrapTraced(
  async (params: LsParams): Promise<LsResult> => {
    const {
      path = '.',
      all = false,
      human_readable = true,
      sort_by = 'name',
      reverse = false,
      filter,
    } = params;

    // Resolve and validate path
    const resolvedPath = resolve(path);
    validateReadPath(resolvedPath);

    if (!existsSync(resolvedPath)) {
      throw new Error(`Path not found: ${resolvedPath}`);
    }

    const stats = await stat(resolvedPath);
    if (!stats.isDirectory()) {
      throw new Error(`Not a directory: ${resolvedPath}`);
    }

    // Read directory entries
    const entries = await readdir(resolvedPath, { withFileTypes: true });

    // Process entries
    const items = await Promise.all(
      entries
        .filter((entry) => all || !entry.name.startsWith('.'))
        .filter((entry) => !filter || minimatch(entry.name, filter))
        .map(async (entry) => {
          const fullPath = join(resolvedPath, entry.name);
          const entryStats = await stat(fullPath);

          return {
            name: entry.name,
            type: getFileType(entry, entryStats),
            size: entryStats.size,
            size_formatted: human_readable ? formatSize(entryStats.size) : String(entryStats.size),
            modified: entryStats.mtime.toISOString(),
            permissions: formatPermissions(entryStats.mode),
            is_hidden: entry.name.startsWith('.'),
          };
        })
    );

    // Sort items
    const sortedItems = sortItems(items, sort_by, reverse);

    return {
      path: resolvedPath,
      total_items: sortedItems.length,
      items: sortedItems,
    };
  },
  { name: 'ls-directory' }
);

function getFileType(entry: Dirent, _stats: Stats): 'file' | 'directory' | 'symlink' {
  if (entry.isSymbolicLink()) return 'symlink';
  if (entry.isDirectory()) return 'directory';
  return 'file';
}

function formatSize(bytes: number): string {
  const units = ['B', 'K', 'M', 'G', 'T'];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }

  return `${size.toFixed(size < 10 && unit > 0 ? 1 : 0)}${units[unit]}`;
}

function formatPermissions(mode: number): string {
  const perms = [
    mode & 0o400 ? 'r' : '-',
    mode & 0o200 ? 'w' : '-',
    mode & 0o100 ? 'x' : '-',
    mode & 0o040 ? 'r' : '-',
    mode & 0o020 ? 'w' : '-',
    mode & 0o010 ? 'x' : '-',
    mode & 0o004 ? 'r' : '-',
    mode & 0o002 ? 'w' : '-',
    mode & 0o001 ? 'x' : '-',
  ];
  return perms.join('');
}

function sortItems(items: FileItem[], sortBy: string, reverse: boolean): FileItem[] {
  const sorted = [...items].sort((a, b) => {
    let result = 0;

    switch (sortBy) {
      case 'name':
        result = a.name.localeCompare(b.name);
        break;
      case 'size':
        result = a.size - b.size;
        break;
      case 'modified':
        result = new Date(a.modified).getTime() - new Date(b.modified).getTime();
        break;
      case 'created':
        // Using modified time as fallback since created time is not available in basic stats
        result = new Date(a.modified).getTime() - new Date(b.modified).getTime();
        break;
    }

    return reverse ? -result : result;
  });

  return sorted;
}

function validateReadPath(filePath: string): void {
  // Block access to sensitive system directories
  const blockedPaths = ['/etc/shadow', '/etc/passwd', '/proc/', '/sys/'];

  // Add user-specific sensitive paths if HOME is available
  if (process.env.HOME) {
    blockedPaths.push(`${process.env.HOME}/.ssh/`, `${process.env.HOME}/.aws/`);
  }

  for (const blocked of blockedPaths) {
    if (filePath.startsWith(blocked)) {
      throw new Error(`Access denied to path: ${filePath}`);
    }
  }

  // Ensure path doesn't contain traversal attempts
  if (filePath.includes('..') || filePath.includes('~')) {
    throw new Error(`Path traversal not allowed: ${filePath}`);
  }
}
