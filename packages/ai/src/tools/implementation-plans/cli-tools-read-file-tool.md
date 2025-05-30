# Read File Tool Implementation Plan

## Overview

Migrate the Rust `read_file_tool.rs` to TypeScript using Mastra framework. This tool reads files from the filesystem with support for line offsets and limits.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/cli_tools/read_file_tool.rs`
- **Purpose**: Read file contents with optional pagination
- **Input**: File path(s), optional offset, optional limit
- **Output**: File contents with line numbers (cat -n format)
- **Key Features**:
  - Single and multiple file reading
  - Line offset and limit support
  - Line number formatting
  - Error handling for missing files
  - Multi-file view with headers

## Dependencies
- Node.js fs/promises for file operations
- Node.js path module
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
export const readFileTool = createTool({
  id: 'read-file',
  description: 'Reads files from the local filesystem with optional line offset and limit',
  inputSchema: z.union([
    z.object({
      file_path: z.string().describe('The absolute path to the file to read'),
      offset: z.number().optional().describe('The line number to start reading from'),
      limit: z.number().optional().describe('The number of lines to read (default: 2000)')
    }),
    z.object({
      file_paths: z.array(z.string()).describe('Array of absolute file paths to read')
    })
  ]),
  outputSchema: z.object({
    content: z.string(),
    files_read: z.number(),
    total_lines: z.number().optional(),
    truncated: z.boolean()
  }),
  execute: async ({ context }) => {
    return await readFiles(context);
  },
});
```

### Dependencies Required

```typescript
import { readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { wrapTraced } from 'braintrust';
```

### Core Implementation

```typescript
interface ReadFileParams {
  file_path?: string;
  file_paths?: string[];
  offset?: number;
  limit?: number;
}

const readFiles = wrapTraced(
  async (params: ReadFileParams) => {
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
        results.push(`Error reading ${filePath}: ${error.message}`);
      }
    }
    
    return {
      content: results.join('\n\n'),
      files_read: filesToRead.length,
      total_lines: totalLines,
      truncated
    };
  },
  { name: 'read-file' }
);

async function readSingleFile(
  filePath: string, 
  offset: number, 
  limit: number, 
  isMultiFile: boolean
) {
  // Security check - ensure path is absolute and safe
  if (!path.isAbsolute(filePath)) {
    throw new Error(`File path must be absolute: ${filePath}`);
  }
  
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
    truncated: endIdx < totalLines
  };
}
```

### Security Implementation

```typescript
function validateFilePath(filePath: string): void {
  // Resolve to absolute path and check for path traversal
  const resolvedPath = path.resolve(filePath);
  
  // Block access to sensitive system directories
  const blockedPaths = [
    '/etc/',
    '/var/log/',
    '/root/',
    '/home/',
    process.env.HOME + '/.ssh/',
    process.env.HOME + '/.aws/'
  ];
  
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
```

## Test Strategy

### Unit Tests (`read-file-tool.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- File reading with offset and limit
- Multi-file reading functionality
- Line number formatting validation
- Path security validation

### Integration Tests (`read-file-tool.integration.test.ts`)
- Real filesystem integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Large file handling
- File encoding support

## Implementation Dependencies

### New TypeScript Packages

- `fs/promises` (Node.js built-in)
- `path` (Node.js built-in)

### Missing from TypeScript

- None - all required functionality available in Node.js

## Test Strategy

### Unit Tests (`read-file-tool.unit.test.ts`)
- Input validation and schema compliance
- File reading logic with mocked fs operations
- Error handling scenarios (file not found, permission denied)
- Path traversal security validation
- Pagination logic (offset/limit parameters)
- Multi-file reading orchestration

### Integration Tests (`read-file-tool.integration.test.ts`)
- Real filesystem operations with temporary files
- Large file handling with pagination
- Binary file detection and handling
- File system permission scenarios
- Security policy enforcement
- Cross-platform path handling

## AI Agent Implementation Time

**Estimated Time**: 2 minutes
**Complexity**: Low

## Implementation Priority

**High** - Core file system tool used by many other tools and workflows.

## Notes

- Consider adding file type detection (binary vs text)
- May want to add syntax highlighting for code files
- Should implement file size limits for safety
- Consider streaming for very large files
- Add support for different encodings if needed