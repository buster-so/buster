import { Storage } from '@google-cloud/storage';
import type {
  ConnectionTestResult,
  DownloadResult,
  GCSConfig,
  ListOptions,
  StorageObject,
  StorageProvider,
  UploadOptions,
  UploadResult,
} from '../types';
import { parseErrorMessage, sanitizeKey, toBuffer } from '../utils';

/**
 * Create a Google Cloud Storage provider
 */
export function createGCSProvider(config: GCSConfig): StorageProvider {
  // Parse service account key
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(config.serviceAccountKey);
  } catch (error) {
    throw new Error(
      `Failed to parse GCS service account key: ${
        error instanceof Error ? error.message : 'Invalid JSON'
      }`
    );
  }

  let storage: Storage;
  // Using a more specific type for bucket instance
  let bucketInstance: ReturnType<Storage['bucket']>;

  try {
    storage = new Storage({
      projectId: config.projectId,
      credentials,
    });

    bucketInstance = storage.bucket(config.bucket);
  } catch (error) {
    throw new Error(
      `Failed to initialize GCS client: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  async function upload(
    key: string,
    data: Buffer | string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const sanitizedKey = sanitizeKey(key);
      const buffer = toBuffer(data);

      const file = bucketInstance.file(sanitizedKey);
      const metadata: Record<string, unknown> = {};
      if (options?.contentType) metadata.contentType = options.contentType;
      if (options?.contentDisposition) metadata.contentDisposition = options.contentDisposition;
      if (options?.metadata) metadata.metadata = options.metadata;

      const stream = file.createWriteStream({
        resumable: false,
        metadata,
      });

      return new Promise((resolve) => {
        stream.on('error', (error: unknown) => {
          resolve({
            success: false,
            key,
            error: parseErrorMessage(error),
          });
        });

        stream.on('finish', () => {
          resolve({
            success: true,
            key: sanitizedKey,
            etag: '',
            size: buffer.length,
          });
        });

        stream.end(buffer);
      });
    } catch (error) {
      return {
        success: false,
        key,
        error: parseErrorMessage(error),
      };
    }
  }

  async function download(key: string): Promise<DownloadResult> {
    try {
      const sanitizedKey = sanitizeKey(key);
      const file = bucketInstance.file(sanitizedKey);

      const [buffer] = await file.download();
      const [metadata] = await file.getMetadata();

      return {
        success: true,
        data: buffer,
        contentType: metadata.contentType || 'application/octet-stream',
        size: buffer.length,
      };
    } catch (error) {
      return {
        success: false,
        error: parseErrorMessage(error),
      };
    }
  }

  async function getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const sanitizedKey = sanitizeKey(key);
    const file = bucketInstance.file(sanitizedKey);

    // Convert seconds to milliseconds and add to current time
    const expires = Date.now() + expiresIn * 1000;

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires,
    });

    return url;
  }

  async function deleteObject(key: string): Promise<boolean> {
    try {
      const sanitizedKey = sanitizeKey(key);
      const file = bucketInstance.file(sanitizedKey);

      await file.delete();
      return true;
    } catch (error) {
      console.error('GCS delete error:', error);
      return false;
    }
  }

  async function exists(key: string): Promise<boolean> {
    try {
      const sanitizedKey = sanitizeKey(key);
      const file = bucketInstance.file(sanitizedKey);

      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error('GCS exists error:', error);
      return false;
    }
  }

  async function list(prefix: string, options?: ListOptions): Promise<StorageObject[]> {
    try {
      const sanitizedPrefix = sanitizeKey(prefix);

      const getFilesOptions: {
        prefix: string;
        maxResults?: number;
        pageToken?: string;
      } = {
        prefix: sanitizedPrefix,
      };
      if (options?.maxKeys !== undefined) {
        getFilesOptions.maxResults = options.maxKeys;
      }
      if (options?.continuationToken !== undefined) {
        getFilesOptions.pageToken = options.continuationToken;
      }

      const [files] = await storage.bucket(config.bucket).getFiles(getFilesOptions);

      return files.map((file) => ({
        key: file.name || '',
        size:
          typeof file.metadata.size === 'string'
            ? Number.parseInt(file.metadata.size, 10)
            : file.metadata.size || 0,
        lastModified: file.metadata.updated
          ? new Date(file.metadata.updated)
          : file.metadata.timeCreated
            ? new Date(file.metadata.timeCreated)
            : new Date(),
        etag: file.metadata.etag || '',
      }));
    } catch (error) {
      console.error('GCS list error:', error);
      return [];
    }
  }

  async function testConnection(): Promise<ConnectionTestResult> {
    const testKey = `_test_${Date.now()}.txt`;
    const testData = 'test';

    try {
      // Test bucket exists
      console.info('GCS: Testing bucket exists for:', config.bucket);
      let bucketExists: boolean;
      try {
        [bucketExists] = await bucketInstance.exists();
      } catch (error) {
        console.error('GCS: Error checking bucket existence:', error);
        return {
          success: false,
          canRead: false,
          canWrite: false,
          canDelete: false,
          error: `Failed to check bucket existence: ${parseErrorMessage(error)}`,
        };
      }

      if (!bucketExists) {
        return {
          success: false,
          canRead: false,
          canWrite: false,
          canDelete: false,
          error: 'Bucket does not exist or is not accessible',
        };
      }

      console.info('GCS: Bucket exists, testing write permission');
      // Test write
      const uploadResult = await upload(testKey, testData);
      if (!uploadResult.success) {
        return {
          success: false,
          canRead: false,
          canWrite: false,
          canDelete: false,
          error: `Cannot write to bucket: ${uploadResult.error}`,
        };
      }

      console.info('GCS: Write successful, testing read permission');
      // Test read
      const downloadResult = await download(testKey);
      if (!downloadResult.success) {
        // Clean up test file
        await deleteObject(testKey);
        return {
          success: false,
          canRead: false,
          canWrite: true,
          canDelete: false,
          error: `Cannot read from bucket: ${downloadResult.error}`,
        };
      }

      console.info('GCS: Read successful, testing delete permission');
      // Test delete
      const deleteResult = await deleteObject(testKey);
      if (!deleteResult) {
        return {
          success: false,
          canRead: true,
          canWrite: true,
          canDelete: false,
          error: 'Cannot delete from bucket',
        };
      }

      console.info('GCS: All tests passed successfully');
      return {
        success: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
      };
    } catch (error) {
      console.error('GCS: Unexpected error during connection test:', error);
      return {
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: parseErrorMessage(error),
      };
    }
  }

  return {
    upload,
    download,
    getSignedUrl,
    delete: deleteObject,
    exists,
    list,
    testConnection,
  };
}
