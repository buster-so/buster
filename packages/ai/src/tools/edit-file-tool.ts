import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { readFile, writeFile, stat, rename, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

interface EditFileParams {
  file_path: string;
  old_string: string;
  new_string: string;
  expected_occurrences?: number;
  create_backup?: boolean;
  preserve_line_endings?: boolean;
}

interface EditFileResult {
  success: boolean;
  replacements_made: number;
  file_path: string;
  backup_path?: string;
  line_changes: Array<{
    line_number: number;
    old_line: string;
    new_line: string;
  }>;
}

export const editFileTool = createTool({
  id: 'edit-file',
  description: 'Perform exact string replacements in files with occurrence validation',
  inputSchema: z.object({
    file_path: z.string().describe('Absolute path to the file to edit'),
    old_string: z.string().describe('Exact string to replace'),
    new_string: z.string().describe('String to replace with'),
    expected_occurrences: z.number().optional()
      .describe('Expected number of replacements (fails if mismatch)'),
    create_backup: z.boolean().default(true).describe('Create backup before editing'),
    preserve_line_endings: z.boolean().default(true).describe('Preserve original line endings')
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
    return await editFile(context as EditFileParams);
  },
});

const editFile = wrapTraced(
  async (params: EditFileParams): Promise<EditFileResult> => {
    const { 
      file_path, 
      old_string, 
      new_string, 
      expected_occurrences,
      create_backup = true,
      preserve_line_endings = true
    } = params;
    
    // Validate file path
    validateFilePath(file_path);
    
    // Validate file exists
    if (!existsSync(file_path)) {
      throw new Error(`File not found: ${file_path}`);
    }
    
    // Validate old_string !== new_string
    if (old_string === new_string) {
      throw new Error('old_string and new_string cannot be the same');
    }
    
    // Validate strings are not empty
    if (old_string === '') {
      throw new Error('old_string cannot be empty');
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
      backup_path: backupPath,
      line_changes: lineChanges.changes
    };
  },
  { name: 'edit-file' }
);

function validateFilePath(filePath: string): void {
  // Ensure path is absolute
  if (!isAbsolute(filePath)) {
    throw new Error(`File path must be absolute: ${filePath}`);
  }

  // Ensure path doesn't contain traversal attempts before resolving
  if (filePath.includes('..') || filePath.includes('~')) {
    throw new Error(`Path traversal not allowed: ${filePath}`);
  }

  // Resolve to absolute path and check for sensitive directories
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
}

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
    if (line && line.includes(oldString)) {
      const newLine = line.replace(new RegExp(escapeRegExp(oldString), 'g'), newString);
      changes.push({
        line_number: i + 1,
        old_line: line,
        new_line: newLine
      });
      newLines.push(newLine);
    } else {
      newLines.push(line || '');
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

async function createBackup(filePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  
  const content = await readFile(filePath, 'utf8');
  await writeFile(backupPath, content);
  
  return backupPath;
}