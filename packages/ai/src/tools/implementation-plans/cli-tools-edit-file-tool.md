# Edit File Tool Implementation Plan

## Overview

Migrate the Rust `edit_file_tool.rs` to TypeScript using Mastra framework. This tool performs precise text replacements in files with occurrence counting.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/cli_tools/edit_file_tool.rs`
- **Purpose**: Perform exact string replacements in files with validation
- **Input**: File path, old string, new string, expected occurrences
- **Output**: Success status and replacement count
- **Key Features**:
  - Exact string matching
  - Occurrence count validation
  - Atomic file updates
  - Preserves file permissions

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
export const editFileTool = createTool({
  id: 'edit-file',
  description: 'Perform exact string replacements in files with occurrence validation',
  inputSchema: z.object({
    file_path: z.string().describe('Absolute path to the file to edit'),
    old_string: z.string().describe('Exact string to replace'),
    new_string: z.string().describe('String to replace with'),
    expected_occurrences: z.number().optional()
      .describe('Expected number of replacements (fails if mismatch)'),
    create_backup: z.boolean().default(true),
    preserve_line_endings: z.boolean().default(true)
  }),
  outputSchema: z.object({
    success: z.boolean(),
    replacements_made: z.number(),
    file_path: z.string(),
    backup_path: z.string().optional(),
    line_changes: z.array(z.object({
      line_number: z.number(),
      old_line: z.string(),
      new_line: z.string()
    }))
  }),
  execute: async ({ context }) => {
    return await editFile(context);
  },
});
```

### Core Implementation

```typescript
const editFile = wrapTraced(
  async (params: EditFileParams) => {
    const { 
      file_path, 
      old_string, 
      new_string, 
      expected_occurrences,
      create_backup = true,
      preserve_line_endings = true
    } = params;
    
    // Validate file exists
    if (!existsSync(file_path)) {
      throw new Error(`File not found: ${file_path}`);
    }
    
    // Validate old_string !== new_string
    if (old_string === new_string) {
      throw new Error('old_string and new_string cannot be the same');
    }
    
    // Read file content
    const content = await readFile(file_path, 'utf8');
    
    // Detect line endings
    const lineEnding = preserve_line_endings ? detectLineEnding(content) : '\n';
    
    // Count occurrences
    const occurrences = countOccurrences(content, old_string);
    
    if (expected_occurrences !== undefined && occurrences !== expected_occurrences) {
      throw new Error(
        `Expected ${expected_occurrences} occurrences but found ${occurrences}`
      );
    }
    
    if (occurrences === 0) {
      throw new Error(`String not found in file: "${old_string}"`);
    }
    
    // Create backup
    let backupPath: string | undefined;
    if (create_backup) {
      backupPath = await createBackup(file_path);
    }
    
    // Perform replacements and track changes
    const lineChanges = performReplacement(content, old_string, new_string, lineEnding);
    
    // Write atomically
    await atomicWriteFile(file_path, lineChanges.newContent);
    
    return {
      success: true,
      replacements_made: occurrences,
      file_path,
      backup_path,
      line_changes: lineChanges.changes
    };
  },
  { name: 'edit-file' }
);

function countOccurrences(content: string, searchString: string): number {
  let count = 0;
  let index = 0;
  
  while ((index = content.indexOf(searchString, index)) !== -1) {
    count++;
    index += searchString.length;
  }
  
  return count;
}

function performReplacement(
  content: string, 
  oldString: string, 
  newString: string,
  lineEnding: string
) {
  const lines = content.split(/\r?\n/);
  const changes: Array<{ line_number: number; old_line: string; new_line: string }> = [];
  const newLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(oldString)) {
      const newLine = line.replace(new RegExp(escapeRegExp(oldString), 'g'), newString);
      changes.push({
        line_number: i + 1,
        old_line: line,
        new_line: newLine
      });
      newLines.push(newLine);
    } else {
      newLines.push(line);
    }
  }
  
  return {
    newContent: newLines.join(lineEnding),
    changes
  };
}

function detectLineEnding(content: string): string {
  const crlfCount = (content.match(/\r\n/g) || []).length;
  const lfCount = (content.match(/(?<!\r)\n/g) || []).length;
  return crlfCount > lfCount ? '\r\n' : '\n';
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  const tempPath = `${filePath}.${randomBytes(8).toString('hex')}.tmp`;
  
  try {
    // Preserve original file permissions
    const stats = await stat(filePath);
    await writeFile(tempPath, content, { mode: stats.mode });
    await rename(tempPath, filePath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  }
}
```

## Test Strategy

### Unit Tests (`edit-file-tool.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Exact string replacement logic
- Occurrence count validation
- Atomic file operations
- Line ending preservation

### Integration Tests (`edit-file-tool.integration.test.ts`)
- Real filesystem integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Backup creation functionality
- Permission preservation

## AI Agent Implementation Time

**Estimated Time**: 3 minutes
**Complexity**: Medium

## Implementation Priority

**High** - Essential for code manipulation workflows.