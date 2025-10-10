export { runTypescript } from './execute/run-typescript';
export { createSandbox } from './management/create-sandbox';
export type { RunTypeScriptOptions, CodeRunResponse } from './execute/run-typescript';
export type { Sandbox } from '@daytonaio/sdk';

// Filesystem operations
export {
  addFiles,
  uploadSingleFile,
  uploadMultipleFiles,
  uploadDirectory,
  normalizePath,
  joinPaths,
  validatePath,
} from './filesystem/add-files';

// Export Zod schemas
export {
  FileInputSchema,
  DirectoryInputSchema,
  UploadOptionsSchema,
  UploadProgressSchema,
  UploadResultSchema,
  FileUploadItemSchema,
} from './filesystem/add-files';

// Export inferred types
export type {
  FileInput,
  DirectoryInput,
  UploadOptions,
  UploadProgress,
  UploadResult,
  FileUploadItem,
} from './filesystem/add-files';

export { runDocsAgent } from './execute/run-docs-agent';