import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { S3Config } from '../types';
import { createS3Provider } from './s3-provider';

// Mock S3Client instance that can be configured per-test
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

describe('S3 Provider', () => {
  const mockConfig: S3Config = {
    provider: 's3',
    region: 'us-east-1',
    bucket: 'test-bucket',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockS3ClientInstance = {
      send: vi.fn(),
    };
    mockS3ClientConstructorArgs = null;
  });

  describe('createS3Provider', () => {
    it('should create S3 client with correct configuration', () => {
      createS3Provider(mockConfig);

      expect(mockS3ClientConstructorArgs).toEqual({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      });
    });
  });

  describe('upload', () => {
    it('should upload data successfully', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({ ETag: '"test-etag"' });

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: true,
        key: 'test-key.txt',
        size: 9, // 'test data'.length
        etag: '"test-etag"',
      });
      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    });

    it('should handle upload with options', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({ ETag: '"test-etag"' });

      const result = await provider.upload('test-key.txt', Buffer.from('test data'), {
        contentType: 'text/plain',
        contentDisposition: 'attachment',
        metadata: { custom: 'value' },
      });

      expect(result.success).toBe(true);
      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    });

    it('should sanitize keys with leading slashes', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({});

      const result = await provider.upload('/path/to/file.txt', 'data');

      expect(result.key).toBe('path/to/file.txt');
    });

    it('should handle upload errors', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('Upload failed'));

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: false,
        key: 'test-key.txt',
        error: 'Upload failed',
      });
    });
  });

  describe('download', () => {
    it('should download data successfully', async () => {
      const provider = createS3Provider(mockConfig);
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield new Uint8Array([116, 101, 115, 116]); // 'test'
        },
      };
      mockS3ClientInstance.send.mockResolvedValue({
        Body: mockBody,
        ContentType: 'text/plain',
      });

      const result = await provider.download('test-key.txt');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toString()).toBe('test');
        expect(result.contentType).toBe('text/plain');
        expect(result.size).toBe(4);
      }
    });

    it('should handle missing body', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({ Body: null });

      const result = await provider.download('test-key.txt');

      expect(result).toEqual({
        success: false,
        error: 'No data returned from S3',
      });
    });

    it('should handle download errors', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('Download failed'));

      const result = await provider.download('test-key.txt');

      expect(result).toEqual({
        success: false,
        error: 'Download failed',
      });
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL', async () => {
      const provider = createS3Provider(mockConfig);
      (getSignedUrl as Mock).mockResolvedValue('https://signed-url.com');

      const url = await provider.getSignedUrl('test-key.txt', 3600);

      expect(url).toBe('https://signed-url.com');
      expect(getSignedUrl).toHaveBeenCalledWith(expect.any(Object), expect.anything(), {
        expiresIn: 3600,
      });
    });
  });

  describe('delete', () => {
    it('should delete object successfully', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({});

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(true);
      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    });

    it('should handle delete errors', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('Delete failed'));

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when object exists', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({});

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(true);
    });

    it('should return false when object does not exist', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('Not found'));

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list objects successfully', async () => {
      const provider = createS3Provider(mockConfig);
      const mockDate = new Date('2024-01-01');
      mockS3ClientInstance.send.mockResolvedValue({
        Contents: [
          {
            Key: 'file1.txt',
            Size: 100,
            LastModified: mockDate,
            ETag: '"etag1"',
          },
          {
            Key: 'file2.txt',
            Size: 200,
            LastModified: mockDate,
          },
        ],
      });

      const result = await provider.list('prefix/');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: 'file1.txt',
        size: 100,
        lastModified: mockDate,
        etag: '"etag1"',
      });
      expect(result[1]).toEqual({
        key: 'file2.txt',
        size: 200,
        lastModified: mockDate,
      });
    });

    it('should handle list with options', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({ Contents: [] });

      await provider.list('prefix/', {
        maxKeys: 10,
        continuationToken: 'token',
      });

      expect(mockS3ClientInstance.send).toHaveBeenCalledTimes(1);
    });

    it('should handle empty list', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockResolvedValue({});

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });

    it('should handle list errors', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValue(new Error('List failed'));

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const provider = createS3Provider(mockConfig);

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

    it('should handle write failure', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3ClientInstance.send.mockRejectedValueOnce(new Error('Write failed'));

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: 'Upload failed: Write failed',
      });
    });

    it('should handle read failure', async () => {
      const provider = createS3Provider(mockConfig);

      // Mock successful upload
      mockS3ClientInstance.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock failed download
      mockS3ClientInstance.send.mockRejectedValueOnce(new Error('Read failed'));

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: true,
        canDelete: false,
        error: 'Download failed: Read failed',
      });
    });

    it('should handle delete failure', async () => {
      const provider = createS3Provider(mockConfig);

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
      mockS3ClientInstance.send.mockRejectedValueOnce(new Error('Delete failed'));

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: true,
        canWrite: true,
        canDelete: false,
        error: 'Delete failed',
      });
    });
  });
});
