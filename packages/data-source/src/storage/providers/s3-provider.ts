import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  ConnectionTestResult,
  DownloadResult,
  ListOptions,
  S3Config,
  StorageObject,
  StorageProvider,
  UploadOptions,
  UploadResult,
} from '../types';
import { parseErrorMessage, sanitizeKey, toBuffer } from '../utils';

/**
 * Create an S3 storage provider
 */
export function createS3Provider(config: S3Config): StorageProvider {
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const bucket = config.bucket;

  async function upload(
    key: string,
    data: Buffer | string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const sanitizedKey = sanitizeKey(key);
      const buffer = toBuffer(data);

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: sanitizedKey,
        Body: buffer,
        ContentType: options?.contentType,
        ContentDisposition: options?.contentDisposition,
        Metadata: options?.metadata,
      });

      const response = await client.send(command);

      const result: UploadResult = {
        success: true,
        key: sanitizedKey,
        size: buffer.length,
      };
      if (response.ETag) {
        result.etag = response.ETag;
      }
      return result;
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

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: sanitizedKey,
      });

      const response = await client.send(command);

      if (!response.Body) {
        return {
          success: false,
          error: 'No data returned from S3',
        };
      }

      const chunks: Uint8Array[] = [];
      const stream = response.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const result: DownloadResult = {
        success: true,
        data: buffer,
        size: buffer.length,
      };
      if (response.ContentType) {
        result.contentType = response.ContentType;
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: parseErrorMessage(error),
      };
    }
  }

  async function getSignedUrlForDownload(key: string, expiresIn: number): Promise<string> {
    const sanitizedKey = sanitizeKey(key);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: sanitizedKey,
    });

    return getSignedUrl(client, command, { expiresIn });
  }

  async function deleteObject(key: string): Promise<boolean> {
    try {
      const sanitizedKey = sanitizeKey(key);

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: sanitizedKey,
      });

      await client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting from S3:', parseErrorMessage(error));
      return false;
    }
  }

  async function exists(key: string): Promise<boolean> {
    try {
      const sanitizedKey = sanitizeKey(key);

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: sanitizedKey,
      });

      await client.send(command);
      return true;
    } catch {
      // Silently return false for existence check
      return false;
    }
  }

  async function list(prefix: string, options?: ListOptions): Promise<StorageObject[]> {
    try {
      const sanitizedPrefix = sanitizeKey(prefix);

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: sanitizedPrefix,
        MaxKeys: options?.maxKeys,
        ContinuationToken: options?.continuationToken,
      });

      const response = await client.send(command);

      return (
        response.Contents?.map((obj) => {
          const item: StorageObject = {
            key: obj.Key || '',
            size: obj.Size || 0,
            lastModified: obj.LastModified || new Date(),
          };
          if (obj.ETag) {
            item.etag = obj.ETag;
          }
          return item;
        }) || []
      );
    } catch (error) {
      console.error('Error listing S3 objects:', parseErrorMessage(error));
      return [];
    }
  }

  async function testConnection(): Promise<ConnectionTestResult> {
    const testKey = `_test_${Date.now()}.txt`;
    const testData = 'test';

    try {
      // Test write
      const uploadResult = await upload(testKey, testData);
      if (!uploadResult.success) {
        return {
          success: false,
          canRead: false,
          canWrite: false,
          canDelete: false,
          error: `Upload failed: ${uploadResult.error}`,
        };
      }

      // Test read
      const downloadResult = await download(testKey);
      if (!downloadResult.success) {
        return {
          success: false,
          canRead: false,
          canWrite: true,
          canDelete: false,
          error: `Download failed: ${downloadResult.error}`,
        };
      }

      // Test delete
      const deleteResult = await deleteObject(testKey);
      if (!deleteResult) {
        return {
          success: false,
          canRead: true,
          canWrite: true,
          canDelete: false,
          error: 'Delete failed',
        };
      }

      return {
        success: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
      };
    } catch (error) {
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
    getSignedUrl: getSignedUrlForDownload,
    delete: deleteObject,
    exists,
    list,
    testConnection,
  };
}
