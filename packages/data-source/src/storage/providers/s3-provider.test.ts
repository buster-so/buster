import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import type { S3Config } from '../types';
import { createS3Provider } from './s3-provider';

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

describe('S3 Provider', () => {
  let mockS3Client: { send: Mock };
  const mockConfig: S3Config = {
    provider: 's3',
    region: 'us-east-1',
    bucket: 'test-bucket',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockS3Client = {
      send: vi.fn(),
    };
    (S3Client as unknown as Mock).mockReturnValue(mockS3Client);
  });

  describe('createS3Provider', () => {
    it('should create S3 client with correct configuration', () => {
      createS3Provider(mockConfig);

      expect(S3Client).toHaveBeenCalledWith({
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
      mockS3Client.send.mockResolvedValue({ ETag: '"test-etag"' });

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: true,
        key: 'test-key.txt',
        size: 9, // 'test data'.length
        etag: '"test-etag"',
      });
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle upload with options', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({ ETag: '"test-etag"' });

      const result = await provider.upload('test-key.txt', Buffer.from('test data'), {
        contentType: 'text/plain',
        contentDisposition: 'attachment',
        metadata: { custom: 'value' },
      });

      expect(result.success).toBe(true);
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should sanitize keys with leading slashes', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({});

      const result = await provider.upload('/path/to/file.txt', 'data');

      expect(result.key).toBe('path/to/file.txt');
    });

    it('should handle upload errors', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('Upload failed'));

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
      mockS3Client.send.mockResolvedValue({
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
      mockS3Client.send.mockResolvedValue({ Body: null });

      const result = await provider.download('test-key.txt');

      expect(result).toEqual({
        success: false,
        error: 'No data returned from S3',
      });
    });

    it('should handle download errors', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('Download failed'));

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
      expect(getSignedUrl).toHaveBeenCalledWith(mockS3Client, expect.anything(), {
        expiresIn: 3600,
      });
    });
  });

  describe('delete', () => {
    it('should delete object successfully', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({});

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(true);
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle delete errors', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('Delete failed'));

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when object exists', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({});

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(true);
    });

    it('should return false when object does not exist', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('Not found'));

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list objects successfully', async () => {
      const provider = createS3Provider(mockConfig);
      const mockDate = new Date('2024-01-01');
      mockS3Client.send.mockResolvedValue({
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
      mockS3Client.send.mockResolvedValue({ Contents: [] });

      await provider.list('prefix/', {
        maxKeys: 10,
        continuationToken: 'token',
      });

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle empty list', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({});

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });

    it('should handle list errors', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('List failed'));

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const provider = createS3Provider(mockConfig);

      // Mock successful upload
      mockS3Client.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock successful download
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield new Uint8Array([116, 101, 115, 116]); // 'test'
        },
      };
      mockS3Client.send.mockResolvedValueOnce({ Body: mockBody });

      // Mock successful delete
      mockS3Client.send.mockResolvedValueOnce({});

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
      });
      expect(mockS3Client.send).toHaveBeenCalledTimes(3);
    });

    it('should handle write failure', async () => {
      const provider = createS3Provider(mockConfig);
      mockS3Client.send.mockRejectedValueOnce(new Error('Write failed'));

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
      mockS3Client.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock failed download
      mockS3Client.send.mockRejectedValueOnce(new Error('Read failed'));

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
      mockS3Client.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock successful download
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield new Uint8Array([116, 101, 115, 116]); // 'test'
        },
      };
      mockS3Client.send.mockResolvedValueOnce({ Body: mockBody });

      // Mock failed delete
      mockS3Client.send.mockRejectedValueOnce(new Error('Delete failed'));

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
