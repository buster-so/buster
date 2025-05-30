# Glob Tool Implementation Plan

## Overview

Migrate the Rust `glob_tool.rs` to TypeScript using Mastra framework. This tool finds files matching glob patterns efficiently.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/cli_tools/glob_tool.rs`
- **Purpose**: Find files matching glob patterns
- **Input**: Glob pattern, base directory, options
- **Output**: List of matching file paths
- **Key Features**:
  - Glob pattern matching
  - Recursive search
  - File type filtering
  - Ignore patterns
  - Performance optimization

## Dependencies
- Node.js fs/promises for filesystem operations
- Node.js path module
- glob library for pattern matching
- Security validation utilities
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Function-based
**Wave**: 1
**AI Agent Time**: 2 minutes
**Depends on**: None (foundational tool)

## TypeScript Implementation

### Tool Definition

```typescript
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
    return await globSearch(context);
  },
});
```

### Core Implementation

```typescript
import { glob, GlobOptions } from 'glob';
import { resolve, relative, isAbsolute } from 'path';

const globSearch = wrapTraced(
  async (params: GlobParams) => {
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
      onlyDirectories: only_directories,
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
      let matches = await glob(pattern, globOptions);
      
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
      if (error.message.includes('Invalid glob pattern')) {
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
    const { patterns, cwd, ignore, deduplicate } = context;
    
    // Run all pattern searches in parallel
    const results = await Promise.all(
      patterns.map(pattern => 
        globSearch({ pattern, cwd, ignore, absolute: true })
      )
    );
    
    // Aggregate results
    const pathToPatterns = new Map<string, string[]>();
    
    results.forEach((result, index) => {
      result.matches.forEach(match => {
        if (!pathToPatterns.has(match)) {
          pathToPatterns.set(match, []);
        }
        pathToPatterns.get(match)!.push(patterns[index]);
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
```

## Test Strategy

### Unit Tests (`glob-tool.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Pattern matching logic
- File filtering functionality
- Ignore pattern application
- Multi-pattern support

### Integration Tests (`glob-tool.integration.test.ts`)
- Real filesystem integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex pattern matching
- Directory vs file filtering

## AI Agent Implementation Time

**Estimated Time**: 2 minutes
**Complexity**: Low-Medium

## Implementation Priority

**Medium** - Important for file discovery workflows.