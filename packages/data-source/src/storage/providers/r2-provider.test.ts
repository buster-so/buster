import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { R2Config } from '../types';
import { createR2Provider } from './r2-provider';

// Mock instance and constructor args
let mockS3ClientInstance: { send: Mock };
let mockS3ClientConstructorArgs: any;

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    constructor(config: any) {
      mockS3ClientConstructorArgs = config;
      Object.assign(this, mockS3ClientInstance);
    }
  },
  PutObjectCommand: class {
    constructor(public input: any) {}
  },
  GetObjectCommand: class {
    constructor(public input: any) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: any) {}
  },
  HeadObjectCommand: class {
    constructor(public input: any) {}
  },
  ListObjectsV2Command: class {
    constructor(public input: any) {}
  },
}));

vi.mock('@aws-sdk/s3-request-presigner');

describe('R2 Provider', () => {
  const mockConfig: R2Config = {
    provider: 'r2',
    accountId: 'test-account-id',
    bucket: 'test-bucket',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockS3ClientInstance = {
      send: vi.fn(),
    };
  });

  describe('createR2Provider', () => {
    it('should create S3 client with R2 endpoint configuration', () => {
      createR2Provider(mockConfig);

      expect(mockS3ClientConstructorArgs).toEqual({
        region: 'auto',
        endpoint: 'https://test-account-id.r2.cloudflarestorage.com',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
        forcePathStyle: true,
        maxAttempts: 3,
        retryMode: 'adaptive',
      });
    });
  });

  describe('upload', () => {
    it('should upload data successfully', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({ ETag: '"test-etag"' });

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: true,
        key: 'test-key.txt',
        size: 9,
        etag: '"test-etag"',
      });
      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    });

    it('should handle upload with Buffer', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({});

      const buffer = Buffer.from('test data');
      const result = await provider.upload('test-key.txt', buffer);

      expect(result.success).toBe(true);
      expect(result.size).toBe(9);
    });

    it('should handle upload with options', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({});

      const result = await provider.upload('test-key.txt', 'test data', {
        contentType: 'text/plain',
        contentDisposition: 'inline',
        metadata: { key: 'value' },
      });

      expect(result.success).toBe(true);
      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    });

    it('should handle upload errors', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('R2 upload failed'));

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: false,
        key: 'test-key.txt',
        error: 'R2 upload failed',
      });
    });
  });

  describe('download', () => {
    it('should download data successfully', async () => {
      const provider = createR2Provider(mockConfig);
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield new Uint8Array([116, 101, 115, 116]); // 'test'
        },
      };
      mockS3ClientInstance.send.mockResolvedValue({
        Body: mockBody,
        ContentType: 'application/octet-stream',
      });

      const result = await provider.download('test-key.txt');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString()).toBe('test');
        expect(result.contentType).toBe('application/octet-stream');
        expect(result.size).toBe(4);
      }
    });

    it('should handle missing body', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({ Body: null });

      const result = await provider.download('test-key.txt');

      expect(result).toEqual({
        success: false,
        error: 'No data returned from R2',
      });
    });

    it('should handle download errors', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('R2 download failed'));

      const result = await provider.download('test-key.txt');

      expect(result).toEqual({
        success: false,
        error: 'R2 download failed',
      });
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL', async () => {
      const provider = createR2Provider(mockConfig);
      (getSignedUrl as Mock).mockResolvedValue('https://r2-signed-url.com');

      const url = await provider.getSignedUrl('test-key.txt', 7200);

      expect(url).toBe('https://r2-signed-url.com');
      expect(getSignedUrl).toHaveBeenCalledWith(expect.any(Object), expect.anything(), {
        expiresIn: 7200,
      });
    });
  });

  describe('delete', () => {
    it('should delete object successfully', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({});

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(true);
      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    });

    it('should handle delete errors gracefully', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('R2 delete failed'));

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when object exists', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({});

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(true);
    });

    it('should return false when object does not exist', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('Not found'));

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list objects successfully', async () => {
      const provider = createR2Provider(mockConfig);
      const mockDate = new Date('2024-01-01');
      mockS3ClientInstance.send.mockResolvedValue({
        Contents: [
          {
            Key: 'prefix/file1.txt',
            Size: 150,
            LastModified: mockDate,
            ETag: '"etag1"',
          },
          {
            Key: 'prefix/file2.txt',
            Size: 250,
            LastModified: mockDate,
          },
        ],
      });

      const result = await provider.list('prefix/');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: 'prefix/file1.txt',
        size: 150,
        lastModified: mockDate,
        etag: '"etag1"',
      });
      expect(result[1]).toEqual({
        key: 'prefix/file2.txt',
        size: 250,
        lastModified: mockDate,
      });
    });

    it('should handle list with pagination options', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({ Contents: [] });

      await provider.list('prefix/', {
        maxKeys: 20,
        continuationToken: 'next-page-token',
      });

      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    });

    it('should handle empty list response', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({ Contents: null });

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });

    it('should handle list errors', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('R2 list failed'));

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('should test all permissions successfully', async () => {
      const provider = createR2Provider(mockConfig);

      // Mock successful upload
      mockS3ClientInstance.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock successful download
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield new Uint8Array([116, 101, 115, 116]); // 'test'
        },
      };
      mockS3ClientInstance.send.mockResolvedValueOnce({ Body: mockBody });

      // Mock successful delete
      mockS3ClientInstance.send.mockResolvedValueOnce({});

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
      });
      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(3);
    });

    it('should detect write permission failure', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValueOnce(new Error('Access denied'));

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: 'Upload failed: Access denied',
      });
    });

    it('should detect read permission failure', async () => {
      const provider = createR2Provider(mockConfig);

      // Mock successful upload
      mockS3ClientInstance.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock failed download
      mockS3ClientInstance.send.mockRejectedValueOnce(new Error('Read denied'));

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: true,
        canDelete: false,
        error: 'Download failed: Read denied',
      });
    });

    it('should detect delete permission failure', async () => {
      const provider = createR2Provider(mockConfig);

      // Mock successful upload
      mockS3ClientInstance.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock successful download
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield new Uint8Array([116, 101, 115, 116]); // 'test'
        },
      };
      mockS3ClientInstance.send.mockResolvedValueOnce({ Body: mockBody });

      // Mock failed delete
      mockS3ClientInstance.send.mockRejectedValueOnce(new Error('Delete denied'));

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: true,
        canWrite: true,
        canDelete: false,
        error: 'Delete failed',
      });
    });

    it('should handle unexpected errors', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3ClientInstance.send.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: 'Upload failed: Network error',
      });
    });
  });
});
