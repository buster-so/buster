import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { glob, type GlobOptions } from 'glob';
import { resolve, isAbsolute } from 'node:path';
import { stat } from 'node:fs/promises';

interface GlobParams {
  pattern: string;
  cwd?: string;
  ignore?: string[];
  only_files?: boolean;
  only_directories?: boolean;
  follow_symlinks?: boolean;
  max_depth?: number;
  absolute?: boolean;
  limit?: number;
}

interface GlobResult {
  pattern: string;
  matches: string[];
  count: number;
  truncated: boolean;
  search_time_ms: number;
}

export const globTool = createTool({
  id: 'glob-search',
  description: 'Find files matching glob patterns with advanced filtering',
  inputSchema: z.object({
    pattern: z.string().describe('Glob pattern (e.g., "**/*.ts", "src/**/*.js")'),
    cwd: z.string().default('.').describe('Base directory for search'),
    ignore: z.array(z.string()).default(['**/node_modules/**', '**/.git/**'])
      .describe('Patterns to ignore'),
    only_files: z.boolean().default(true).describe('Only return files (not directories)'),
    only_directories: z.boolean().default(false).describe('Only return directories'),
    follow_symlinks: z.boolean().default(false).describe('Follow symbolic links'),
    max_depth: z.number().optional().describe('Maximum depth to search'),
    absolute: z.boolean().default(false).describe('Return absolute paths'),
    limit: z.number().default(1000).describe('Maximum results to return')
  }),
  outputSchema: z.object({
    pattern: z.string(),
    matches: z.array(z.string()),
    count: z.number(),
    truncated: z.boolean(),
    search_time_ms: z.number()
  }),
  execute: async ({ context }) => {
    return await globSearch(context as GlobParams);
  },
});

const globSearch = wrapTraced(
  async (params: GlobParams): Promise<GlobResult> => {
    const startTime = Date.now();
    const {
      pattern,
      cwd = '.',
      ignore = ['**/node_modules/**', '**/.git/**'],
      only_files = true,
      only_directories = false,
      follow_symlinks = false,
      max_depth,
      absolute = false,
      limit = 1000
    } = params;
    
    // Validate pattern
    if (!pattern || pattern.trim() === '') {
      throw new Error('Pattern cannot be empty');
    }
    
    // Resolve base directory
    const basePath = resolve(cwd);
    validateReadPath(basePath);
    
    // Configure glob options
    const globOptions: GlobOptions = {
      cwd: basePath,
      ignore,
      follow: follow_symlinks,
      nodir: only_files && !only_directories,
      maxDepth: max_depth,
      absolute: false, // We'll handle this ourselves
      dot: true, // Include hidden files
      matchBase: true,
      nobrace: false,
      nocase: process.platform === 'win32',
      noext: false,
      noglobstar: false
    };
    
    try {
      // Perform glob search
      let rawMatches = await glob(pattern, globOptions);
      let matches = Array.isArray(rawMatches) ? rawMatches.map(m => String(m)) : [String(rawMatches)];
      
      // Apply custom filters
      if (only_directories && !only_files) {
        matches = await filterDirectories(matches, basePath);
      }
      
      // Convert to absolute paths if requested
      if (absolute) {
        matches = matches.map(match => resolve(basePath, match));
      }
      
      // Apply limit
      const truncated = matches.length > limit;
      if (truncated) {
        matches = matches.slice(0, limit);
      }
      
      const searchTime = Date.now() - startTime;
      
      return {
        pattern,
        matches,
        count: matches.length,
        truncated,
        search_time_ms: searchTime
      };
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid glob pattern')) {
        throw new Error(`Invalid glob pattern: ${pattern}`);
      }
      throw error;
    }
  },
  { name: 'glob-search' }
);

async function filterDirectories(paths: string[], basePath: string): Promise<string[]> {
  const results = await Promise.all(
    paths.map(async (path) => {
      try {
        const fullPath = resolve(basePath, path);
        const stats = await stat(fullPath);
        return stats.isDirectory() ? path : null;
      } catch {
        return null;
      }
    })
  );
  
  return results.filter((path): path is string => path !== null);
}

function validateReadPath(path: string): void {
  // Ensure path is absolute
  if (!isAbsolute(path)) {
    throw new Error(`Path must be absolute: ${path}`);
  }

  // Ensure path doesn't contain traversal attempts before resolving
  if (path.includes('..') || path.includes('~')) {
    throw new Error(`Path traversal not allowed: ${path}`);
  }

  // Resolve to absolute path and check for sensitive directories
  const resolvedPath = resolve(path);

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
}

// Advanced glob with multiple patterns
export const multiGlobTool = createTool({
  id: 'multi-glob-search',
  description: 'Search with multiple glob patterns simultaneously',
  inputSchema: z.object({
    patterns: z.array(z.string()).describe('Array of glob patterns'),
    cwd: z.string().default('.'),
    ignore: z.array(z.string()).default(['**/node_modules/**', '**/.git/**']),
    deduplicate: z.boolean().default(true)
  }),
  outputSchema: z.object({
    patterns: z.array(z.string()),
    matches: z.array(z.object({
      path: z.string(),
      matched_patterns: z.array(z.string())
    })),
    total_matches: z.number(),
    search_time_ms: z.number()
  }),
  execute: async ({ context }) => {
    const startTime = Date.now();
    const { patterns, cwd, ignore } = context;
    
    // Run all pattern searches in parallel
    const results = await Promise.all(
      patterns.map(pattern => 
        globSearch({ pattern, cwd: cwd || '.', ignore, absolute: true })
      )
    );
    
    // Aggregate results
    const pathToPatterns = new Map<string, string[]>();
    
    results.forEach((result, index) => {
      result.matches.forEach(match => {
        if (!pathToPatterns.has(match)) {
          pathToPatterns.set(match, []);
        }
        const existingPatterns = pathToPatterns.get(match);
        const pattern = patterns[index];
        if (existingPatterns && pattern) {
          existingPatterns.push(pattern);
        }
      });
    });
    
    const matches = Array.from(pathToPatterns.entries()).map(([path, matchedPatterns]) => ({
      path,
      matched_patterns: matchedPatterns
    }));
    
    return {
      patterns,
      matches,
      total_matches: matches.length,
      search_time_ms: Date.now() - startTime
    };
  }
});