import { z } from 'zod';
import type { StorageProvider } from './responses';

// Storage configuration types for internal use
export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  credentials: S3Credentials | R2Credentials | GCSCredentials;
}

export interface S3Credentials {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface GCSCredentials {
  projectId: string;
  serviceAccountKey: string;
}

// Storage operation result types
export interface StorageOperationResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface UploadResult extends StorageOperationResult {
  key: string;
  size?: number;
  etag?: string;
}

export interface DownloadResult extends StorageOperationResult {
  data?: Buffer;
  contentType?: string;
  size?: number;
}

export interface SignedUrlResult extends StorageOperationResult {
  url: string;
  expiresAt: string;
}

// Validation result for testing credentials
export const CredentialValidationResultSchema = z.object({
  valid: z.boolean(),
  error: z.string().optional(),
  details: z
    .object({
      canRead: z.boolean().optional(),
      canWrite: z.boolean().optional(),
      bucketExists: z.boolean().optional(),
    })
    .optional(),
});

export type CredentialValidationResult = z.infer<typeof CredentialValidationResultSchema>;
