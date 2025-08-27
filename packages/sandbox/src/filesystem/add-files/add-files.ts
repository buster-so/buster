import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Sandbox } from '@daytonaio/sdk';
import { z } from 'zod';

// Zod schemas for file operations
export const FileInputSchema = z.object({
  path: z.string(),
  content: z.union([z.instanceof(Buffer), z.string()]).optional(),
  destination: z.string().optional(),
});

export const DirectoryInputSchema = z.object({
  path: z.string(),
  destination: z.string().optional(),
  includePattern: z.string().optional(),
  excludePattern: z.string().optional(),
});

export const UploadProgressSchema = z.object({
  totalFiles: z.number(),
  uploadedFiles: z.number(),
  currentFile: z.string().optional(),
  percentage: z.number(),
});

export const UploadOptionsSchema = z.object({
  baseDestination: z.string().optional(),
  permissions: z.string().optional(),
  overwrite: z.boolean().optional(),
  preserveStructure: z.boolean().optional(),
  onProgress: z.function().args(UploadProgressSchema).returns(z.void()).optional(),
});

export const UploadResultSchema = z.object({
  success: z.boolean(),
  uploadedFiles: z.array(z.string()),
  failedFiles: z
    .array(
      z.object({
        path: z.string(),
        error: z.string(),
      })
    )
    .optional(),
  totalSize: z.number().optional(),
});

export const FileUploadItemSchema = z.object({
  source: z.instanceof(Buffer),
  destination: z.string(),
});

// Export inferred types
export type FileInput = z.infer<typeof FileInputSchema>;
export type DirectoryInput = z.infer<typeof DirectoryInputSchema>;
export type UploadOptions = z.infer<typeof UploadOptionsSchema>;
export type UploadProgress = z.infer<typeof UploadProgressSchema>;
export type UploadResult = z.infer<typeof UploadResultSchema>;
export type FileUploadItem = z.infer<typeof FileUploadItemSchema>;

// Path utilities
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
}

export function joinPaths(...paths: string[]): string {
  return normalizePath(path.join(...paths));
}

export function validatePath(filePath: string): void {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid path: path must be a non-empty string');
  }

  // Check for path traversal attempts
  const normalized = path.normalize(filePath);
  if (normalized.includes('..') || normalized.startsWith('/')) {
    throw new Error('Invalid path: path traversal or absolute paths not allowed');
  }
}

// Single file upload
export async function uploadSingleFile(
  sandbox: Sandbox,
  filePath: string,
  destination: string,
  options?: UploadOptions
): Promise<UploadResult> {
  try {
    validatePath(destination);

    const content = await fs.readFile(filePath);
    const destPath = options?.baseDestination
      ? joinPaths(options.baseDestination, destination)
      : destination;

    // Create parent directory if needed
    const parentDir = path.dirname(destPath);
    if (parentDir && parentDir !== '.') {
      await sandbox.fs.createFolder(parentDir, options?.permissions || '755');
    }

    await sandbox.fs.uploadFile(content, destPath);

    return {
      success: true,
      uploadedFiles: [destPath],
      totalSize: content.length,
    };
  } catch (error) {
    return {
      success: false,
      uploadedFiles: [],
      failedFiles: [
        {
          path: filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
}

// Multiple files upload with batching
export async function uploadMultipleFiles(
  sandbox: Sandbox,
  files: FileInput[],
  options?: UploadOptions
): Promise<UploadResult> {
  const uploadedFiles: string[] = [];
  const failedFiles: Array<{ path: string; error: string }> = [];
  let totalSize = 0;

  // Create file upload items
  const fileUploadItems: FileUploadItem[] = [];

  for (const file of files) {
    try {
      validatePath(file.destination || file.path);

      const content = file.content
        ? typeof file.content === 'string'
          ? Buffer.from(file.content)
          : file.content
        : await fs.readFile(file.path);

      const destination = file.destination || file.path;
      const destPath = options?.baseDestination
        ? joinPaths(options.baseDestination, destination)
        : destination;

      fileUploadItems.push({
        source: content,
        destination: destPath,
      });

      totalSize += content.length;
    } catch (error) {
      failedFiles.push({
        path: file.path,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Batch upload files
  if (fileUploadItems.length > 0) {
    try {
      // Create necessary directories first
      const directories = new Set<string>();
      for (const item of fileUploadItems) {
        const dir = path.dirname(item.destination);
        if (dir && dir !== '.') {
          directories.add(dir);
        }
      }

      // Sort directories by depth to create parent dirs first
      const sortedDirs = Array.from(directories).sort(
        (a, b) => a.split('/').length - b.split('/').length
      );

      for (const dir of sortedDirs) {
        await sandbox.fs.createFolder(dir, options?.permissions || '755');
      }

      // Upload files in batches
      const BATCH_SIZE = 10;
      for (let i = 0; i < fileUploadItems.length; i += BATCH_SIZE) {
        const batch = fileUploadItems.slice(i, i + BATCH_SIZE);

        await sandbox.fs.uploadFiles(
          batch.map((item) => ({
            source: item.source,
            destination: item.destination,
          }))
        );
        uploadedFiles.push(...batch.map((item) => item.destination));

        // Report progress after upload
        if (options?.onProgress && batch[0]) {
          options.onProgress({
            totalFiles: files.length,
            uploadedFiles: uploadedFiles.length,
            currentFile: batch[0].destination,
            percentage: Math.round((uploadedFiles.length / files.length) * 100),
          });
        }
      }
    } catch (_error) {
      // If batch upload fails, try individual uploads
      for (const item of fileUploadItems) {
        try {
          await sandbox.fs.uploadFile(item.source, item.destination);
          uploadedFiles.push(item.destination);
        } catch (uploadError) {
          failedFiles.push({
            path: item.destination,
            error: uploadError instanceof Error ? uploadError.message : 'Unknown error',
          });
        }
      }
    }
  }

  return {
    success: failedFiles.length === 0,
    uploadedFiles,
    ...(failedFiles.length > 0 && { failedFiles }),
    totalSize,
  };
}

// Directory upload
export async function uploadDirectory(
  sandbox: Sandbox,
  dirPath: string,
  destination?: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const files: FileInput[] = [];

  async function scanDirectory(currentPath: string, baseDir: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath, baseDir);
      } else if (entry.isFile()) {
        const relativePath = path.relative(baseDir, fullPath);
        const destPath = destination ? joinPaths(destination, relativePath) : relativePath;

        files.push({
          path: fullPath,
          destination: destPath,
        });
      }
    }
  }

  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path ${dirPath} is not a directory`);
    }

    await scanDirectory(dirPath, dirPath);

    return uploadMultipleFiles(sandbox, files, options);
  } catch (error) {
    return {
      success: false,
      uploadedFiles: [],
      failedFiles: [
        {
          path: dirPath,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    };
  }
}

// Main API function
export async function addFiles(
  sandbox: Sandbox,
  input: string | FileInput | FileInput[] | DirectoryInput,
  options?: UploadOptions
): Promise<UploadResult> {
  // Handle string input as file path
  if (typeof input === 'string') {
    const stats = await fs.stat(input);

    if (stats.isDirectory()) {
      return uploadDirectory(sandbox, input, undefined, options);
    }
    return uploadSingleFile(sandbox, input, path.basename(input), options);
  }

  // Handle array of files
  if (Array.isArray(input)) {
    return uploadMultipleFiles(sandbox, input, options);
  }

  // Type guard for objects
  if (typeof input === 'object' && input !== null) {
    // Handle directory input
    if ('includePattern' in input || ('path' in input && !('content' in input))) {
      const dirInput = input as DirectoryInput;
      const stats = await fs.stat(dirInput.path);
      if (stats.isDirectory()) {
        return uploadDirectory(sandbox, dirInput.path, dirInput.destination, options);
      }
    }

    // Handle single file input
    if ('path' in input) {
      const fileInput = input as FileInput;
      if (fileInput.content) {
        // Content provided directly
        return uploadMultipleFiles(sandbox, [fileInput], options);
      }
      // Read from file system
      return uploadSingleFile(
        sandbox,
        fileInput.path,
        fileInput.destination || fileInput.path,
        options
      );
    }
  }

  throw new Error(
    'Invalid input: must be a file path, FileInput, array of FileInput, or DirectoryInput'
  );
}
