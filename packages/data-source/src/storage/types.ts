export interface StorageProvider {
  /**
   * Upload data to storage
   */
  upload(key: string, data: Buffer | string, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Download data from storage
   */
  download(key: string): Promise<DownloadResult>;

  /**
   * Generate a presigned URL for download
   */
  getSignedUrl(key: string, expiresIn: number): Promise<string>;

  /**
   * Delete an object from storage
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if an object exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * List objects with a prefix
   */
  list(prefix: string, options?: ListOptions): Promise<StorageObject[]>;

  /**
   * Test connectivity and permissions
   */
  testConnection(): Promise<ConnectionTestResult>;
}

export interface UploadOptions {
  contentType?: string;
  contentDisposition?: string;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  success: boolean;
  key: string;
  etag?: string;
  size?: number;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  size?: number;
  error?: string;
}

export interface ListOptions {
  maxKeys?: number;
  continuationToken?: string;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  error?: string;
}

export interface S3Config {
  provider: 's3';
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface R2Config {
  provider: 'r2';
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface GCSConfig {
  provider: 'gcs';
  projectId: string;
  bucket: string;
  serviceAccountKey: string;
}

export type StorageConfig = S3Config | R2Config | GCSConfig;
