import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import type { R2Config } from '../types';
import { createR2Provider } from './r2-provider';

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner');

describe('R2 Provider', () => {
  let mockS3Client: { send: Mock };
  const mockConfig: R2Config = {
    provider: 'r2',
    accountId: 'test-account-id',
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

  describe('createR2Provider', () => {
    it('should create S3 client with R2 endpoint configuration', () => {
      createR2Provider(mockConfig);

      expect(S3Client).toHaveBeenCalledWith({
        region: 'auto',
        endpoint: 'https://test-account-id.r2.cloudflarestorage.com',
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
        forcePathStyle: true,
      });
    });
  });

  describe('upload', () => {
    it('should upload data successfully', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({ ETag: '"test-etag"' });

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: true,
        key: 'test-key.txt',
        size: 9,
        etag: '"test-etag"',
      });
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle upload with Buffer', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({});

      const buffer = Buffer.from('test data');
      const result = await provider.upload('test-key.txt', buffer);

      expect(result.success).toBe(true);
      expect(result.size).toBe(9);
    });

    it('should handle upload with options', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({});

      const result = await provider.upload('test-key.txt', 'test data', {
        contentType: 'text/plain',
        contentDisposition: 'inline',
        metadata: { key: 'value' },
      });

      expect(result.success).toBe(true);
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle upload errors', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('R2 upload failed'));

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
      mockS3Client.send.mockResolvedValue({
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
      mockS3Client.send.mockResolvedValue({ Body: null });

      const result = await provider.download('test-key.txt');

      expect(result).toEqual({
        success: false,
        error: 'No data returned from R2',
      });
    });

    it('should handle download errors', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('R2 download failed'));

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
      expect(getSignedUrl).toHaveBeenCalledWith(mockS3Client, expect.anything(), {
        expiresIn: 7200,
      });
    });
  });

  describe('delete', () => {
    it('should delete object successfully', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({});

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(true);
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle delete errors gracefully', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('R2 delete failed'));

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when object exists', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({});

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(true);
    });

    it('should return false when object does not exist', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('Not found'));

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list objects successfully', async () => {
      const provider = createR2Provider(mockConfig);
      const mockDate = new Date('2024-01-01');
      mockS3Client.send.mockResolvedValue({
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
      mockS3Client.send.mockResolvedValue({ Contents: [] });

      await provider.list('prefix/', {
        maxKeys: 20,
        continuationToken: 'next-page-token',
      });

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle empty list response', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockResolvedValue({ Contents: null });

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });

    it('should handle list errors', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockRejectedValue(new Error('R2 list failed'));

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('should test all permissions successfully', async () => {
      const provider = createR2Provider(mockConfig);

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

    it('should detect write permission failure', async () => {
      const provider = createR2Provider(mockConfig);
      mockS3Client.send.mockRejectedValueOnce(new Error('Access denied'));

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
      mockS3Client.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock failed download
      mockS3Client.send.mockRejectedValueOnce(new Error('Read denied'));

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
      mockS3Client.send.mockResolvedValueOnce({ ETag: '"test"' });

      // Mock successful download
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield new Uint8Array([116, 101, 115, 116]); // 'test'
        },
      };
      mockS3Client.send.mockResolvedValueOnce({ Body: mockBody });

      // Mock failed delete
      mockS3Client.send.mockRejectedValueOnce(new Error('Delete denied'));

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
      mockS3Client.send.mockImplementation(() => {
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
