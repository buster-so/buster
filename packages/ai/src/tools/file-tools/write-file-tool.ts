import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  chmod,
  copyFile,
  writeFile as fsWriteFile,
  mkdir,
  rename,
  stat,
  unlink,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface WriteFileParams {
  file_path: string;
  content: string;
  overwrite?: boolean;
  create_backup?: boolean;
  encoding?: 'utf8' | 'ascii' | 'base64';
  mode?: string;
}

interface WriteFileResult {
  success: boolean;
  file_path: string;
  bytes_written: number;
  backup_path?: string;
  created_directories: string[];
}

export const writeFileTool = createTool({
  id: 'write-file',
  description: 'Write content to a file with atomic operations and safety checks',
  inputSchema: z.object({
    file_path: z.string().describe('Absolute path to write the file'),
    content: z.string().describe('Content to write to the file'),
    overwrite: z.boolean().default(false).describe('Whether to overwrite existing file'),
    create_backup: z.boolean().default(true).describe('Create backup of existing file'),
    encoding: z.enum(['utf8', 'ascii', 'base64']).default('utf8'),
    mode: z.string().optional().describe('File permissions (e.g., "0644")'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    file_path: z.string(),
    bytes_written: z.number(),
    backup_path: z.string().optional(),
    created_directories: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    return await writeFile(context as WriteFileParams);
  },
});

const writeFile = wrapTraced(
  async (params: WriteFileParams): Promise<WriteFileResult> => {
    const {
      file_path,
      content,
      overwrite = false,
      create_backup = true,
      encoding = 'utf8',
      mode,
    } = params;

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
      if (mode) {
        await chmod(tempPath, mode);
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
        created_directories: createdDirs,
      };
    } catch (error) {
      // Cleanup temp file on error
      try {
        await unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }

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
  const resolvedPath = resolve(filePath);

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
    '/sbin/',
    '/var/log/',
  ];

  for (const blocked of blockedPaths) {
    if (resolvedPath.startsWith(blocked)) {
      throw new Error(`Write access denied to system directory: ${resolvedPath}`);
    }
  }

  // Ensure path doesn't contain traversal attempts
  if (filePath.includes('..') || filePath.includes('~')) {
    throw new Error(`Path traversal not allowed: ${filePath}`);
  }
}
