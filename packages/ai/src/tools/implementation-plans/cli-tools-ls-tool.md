# LS Tool Implementation Plan

## Overview

Migrate the Rust `ls_tool.rs` to TypeScript using Mastra framework. This tool lists directory contents with filtering and metadata.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/cli_tools/ls_tool.rs`
- **Purpose**: List directory contents with detailed information
- **Input**: Directory path, optional filters, options
- **Output**: File listing with metadata
- **Key Features**:
  - File type detection
  - Size formatting
  - Permission display
  - Hidden file filtering
  - Sorting options

## Dependencies
- Node.js fs/promises for filesystem operations
- Node.js path module
- Security validation utilities
- minimatch for pattern matching
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
    filter: z.string().optional().describe('Filter pattern (glob)')
  }),
  outputSchema: z.object({
    path: z.string(),
    total_items: z.number(),
    items: z.array(z.object({
      name: z.string(),
      type: z.enum(['file', 'directory', 'symlink']),
      size: z.number(),
      size_formatted: z.string(),
      modified: z.string(),
      permissions: z.string(),
      is_hidden: z.boolean()
    }))
  }),
  execute: async ({ context }) => {
    return await listDirectory(context);
  },
});
```

### Core Implementation

```typescript
const listDirectory = wrapTraced(
  async (params: LsParams) => {
    const {
      path = '.',
      all = false,
      long = true,
      human_readable = true,
      sort_by = 'name',
      reverse = false,
      filter
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
        .filter(entry => all || !entry.name.startsWith('.'))
        .filter(entry => !filter || minimatch(entry.name, filter))
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
            is_hidden: entry.name.startsWith('.')
          };
        })
    );
    
    // Sort items
    const sortedItems = sortItems(items, sort_by, reverse);
    
    return {
      path: resolvedPath,
      total_items: sortedItems.length,
      items: sortedItems
    };
  },
  { name: 'ls-directory' }
);

function getFileType(entry: Dirent, stats: Stats): 'file' | 'directory' | 'symlink' {
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
    (mode & 0o400) ? 'r' : '-',
    (mode & 0o200) ? 'w' : '-',
    (mode & 0o100) ? 'x' : '-',
    (mode & 0o040) ? 'r' : '-',
    (mode & 0o020) ? 'w' : '-',
    (mode & 0o010) ? 'x' : '-',
    (mode & 0o004) ? 'r' : '-',
    (mode & 0o002) ? 'w' : '-',
    (mode & 0o001) ? 'x' : '-'
  ];
  return perms.join('');
}

function sortItems(items: any[], sortBy: string, reverse: boolean) {
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
    }
    
    return reverse ? -result : result;
  });
  
  return sorted;
}
```

## Test Strategy

### Unit Tests (`ls-tool.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Directory listing functionality
- File filtering and sorting
- Permission formatting
- Size formatting validation

### Integration Tests (`ls-tool.integration.test.ts`)
- Real filesystem integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Hidden file handling
- Pattern matching capabilities

## AI Agent Implementation Time

**Estimated Time**: 2 minutes
**Complexity**: Low

## Implementation Priority

**Medium** - Important for file system navigation.