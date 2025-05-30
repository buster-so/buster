# Write File Tool Implementation Plan

## Overview

Migrate the Rust `write_file_tool.rs` to TypeScript using Mastra framework. This tool writes content to files with safety checks and atomic operations.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/cli_tools/write_file_tool.rs`
- **Purpose**: Write content to files with safety and atomicity
- **Input**: File path, content, optional overwrite flag
- **Output**: Success status and file metadata
- **Key Features**:
  - Path validation and security checks
  - Atomic write operations
  - Backup creation for existing files
  - Directory creation if needed
  - Encoding support

## Dependencies
- Node.js fs/promises for file operations
- Node.js path module
- Node.js crypto module for atomic operations
- Security validation utilities
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Function-based
**Wave**: 1
**AI Agent Time**: 3 minutes
**Depends on**: None (foundational tool)

## TypeScript Implementation

### Tool Definition

```typescript
export const writeFileTool = createTool({
  id: 'write-file',
  description: 'Write content to a file with atomic operations and safety checks',
  inputSchema: z.object({
    file_path: z.string().describe('Absolute path to write the file'),
    content: z.string().describe('Content to write to the file'),
    overwrite: z.boolean().default(false).describe('Whether to overwrite existing file'),
    create_backup: z.boolean().default(true).describe('Create backup of existing file'),
    encoding: z.enum(['utf8', 'ascii', 'base64']).default('utf8'),
    mode: z.string().optional().describe('File permissions (e.g., "0644")')
  }),
  outputSchema: z.object({
    success: z.boolean(),
    file_path: z.string(),
    bytes_written: z.number(),
    backup_path: z.string().optional(),
    created_directories: z.array(z.string())
  }),
  execute: async ({ context }) => {
    return await writeFile(context);
  },
});
```

### Core Implementation

```typescript
import { writeFile as fsWriteFile, mkdir, stat, copyFile, rename } from 'fs/promises';
import { dirname, join, isAbsolute } from 'path';
import { existsSync } from 'fs';
import { randomBytes } from 'crypto';

const writeFile = wrapTraced(
  async (params: WriteFileParams) => {
    const { file_path, content, overwrite = false, create_backup = true, encoding = 'utf8' } = params;
    
    // Security validation
    validateWritePath(file_path);
    
    if (!isAbsolute(file_path)) {
      throw new Error('File path must be absolute');
    }
    
    const fileExists = existsSync(file_path);
    
    if (fileExists && !overwrite) {
      throw new Error(`File already exists: ${file_path}. Set overwrite=true to replace.`);
    }
    
    // Create directories if needed
    const createdDirs = await ensureDirectoryExists(dirname(file_path));
    
    // Create backup if file exists
    let backupPath: string | undefined;
    if (fileExists && create_backup) {
      backupPath = await createBackup(file_path);
    }
    
    // Atomic write using temp file + rename
    const tempPath = `${file_path}.${randomBytes(8).toString('hex')}.tmp`;
    
    try {
      // Write to temp file
      await fsWriteFile(tempPath, content, { encoding });
      
      // Set permissions if specified
      if (params.mode) {
        await chmod(tempPath, params.mode);
      }
      
      // Atomic rename
      await rename(tempPath, file_path);
      
      // Get file size
      const stats = await stat(file_path);
      
      return {
        success: true,
        file_path,
        bytes_written: stats.size,
        backup_path: backupPath,
        created_directories: createdDirs
      };
      
    } catch (error) {
      // Cleanup temp file on error
      try {
        await unlink(tempPath);
      } catch {}
      
      throw error;
    }
  },
  { name: 'write-file' }
);

async function ensureDirectoryExists(dirPath: string): Promise<string[]> {
  const created: string[] = [];
  const parts = dirPath.split('/').filter(Boolean);
  let currentPath = '/';
  
  for (const part of parts) {
    currentPath = join(currentPath, part);
    
    if (!existsSync(currentPath)) {
      await mkdir(currentPath, { recursive: false });
      created.push(currentPath);
    }
  }
  
  return created;
}

async function createBackup(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  await copyFile(filePath, backupPath);
  return backupPath;
}

function validateWritePath(filePath: string): void {
  const resolvedPath = path.resolve(filePath);
  
  // Block system directories
  const blockedPaths = [
    '/etc/',
    '/sys/',
    '/proc/',
    '/dev/',
    '/boot/',
    '/usr/bin/',
    '/usr/sbin/',
    '/bin/',
    '/sbin/'
  ];
  
  for (const blocked of blockedPaths) {
    if (resolvedPath.startsWith(blocked)) {
      throw new Error(`Write access denied to system directory: ${resolvedPath}`);
    }
  }
}
```

## Test Strategy

### Unit Tests (`write-file-tool.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Atomic write operations
- Backup creation functionality
- Directory creation logic
- Security path validation

### Integration Tests (`write-file-tool.integration.test.ts`)
- Real filesystem integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- File encoding support
- Permission handling

## AI Agent Implementation Time

**Estimated Time**: 3 minutes
**Complexity**: Low-Medium

## Implementation Priority

**High** - Core file system operation needed by many other tools.