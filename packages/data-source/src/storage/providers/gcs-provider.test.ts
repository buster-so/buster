import { Storage } from '@google-cloud/storage';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { GCSConfig } from '../types';
import { createGCSProvider } from './gcs-provider';

vi.mock('@google-cloud/storage');

describe('GCS Provider', () => {
  let mockBucket: {
    file: Mock;
    exists: Mock;
    getFiles: Mock;
  };
  let mockFile: {
    createWriteStream: Mock;
    download: Mock;
    getMetadata: Mock;
    getSignedUrl: Mock;
    delete: Mock;
    exists: Mock;
    name?: string;
    metadata?: Record<string, unknown>;
  };
  let mockStorage: {
    bucket: Mock;
  };

  const mockConfig: GCSConfig = {
    provider: 'gcs',
    projectId: 'test-project',
    bucket: 'test-bucket',
    serviceAccountKey: JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key: 'test-key',
      client_email: 'test@example.com',
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFile = {
      createWriteStream: vi.fn(),
      download: vi.fn(),
      getMetadata: vi.fn(),
      getSignedUrl: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    };

    mockBucket = {
      file: vi.fn().mockReturnValue(mockFile),
      exists: vi.fn(),
      getFiles: vi.fn(),
    };

    mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket),
    };

    (Storage as unknown as Mock).mockReturnValue(mockStorage);
  });

  describe('createGCSProvider', () => {
    it('should create GCS client with correct configuration', () => {
      createGCSProvider(mockConfig);

      expect(Storage).toHaveBeenCalledWith({
        projectId: 'test-project',
        credentials: {
          type: 'service_account',
          project_id: 'test-project',
          private_key: 'test-key',
          client_email: 'test@example.com',
        },
      });
    });

    it('should throw error for invalid service account key', () => {
      const invalidConfig: GCSConfig = {
        ...mockConfig,
        serviceAccountKey: 'invalid-json',
      };

      expect(() => createGCSProvider(invalidConfig)).toThrow(
        'Failed to parse GCS service account key'
      );
    });

    it('should handle initialization errors', () => {
      (Storage as unknown as Mock).mockImplementation(() => {
        throw new Error('Storage init failed');
      });

      expect(() => createGCSProvider(mockConfig)).toThrow(
        'Failed to initialize GCS client: Storage init failed'
      );
    });
  });

  describe('upload', () => {
    it('should upload data successfully', async () => {
      const provider = createGCSProvider(mockConfig);
      const mockStream = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockStream;
        }),
        end: vi.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: true,
        key: 'test-key.txt',
        etag: '',
        size: 9,
      });
      expect(mockStream.end).toHaveBeenCalledWith(Buffer.from('test data'));
    });

    it('should handle upload with options', async () => {
      const provider = createGCSProvider(mockConfig);
      const mockStream = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockStream;
        }),
        end: vi.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      const result = await provider.upload('test-key.txt', Buffer.from('test'), {
        contentType: 'text/plain',
        contentDisposition: 'attachment',
        metadata: { custom: 'value' },
      });

      expect(result.success).toBe(true);
      expect(mockFile.createWriteStream).toHaveBeenCalledWith({
        resumable: false,
        metadata: {
          contentType: 'text/plain',
          contentDisposition: 'attachment',
          metadata: { custom: 'value' },
        },
      });
    });

    it('should sanitize keys', async () => {
      const provider = createGCSProvider(mockConfig);
      const mockStream = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockStream;
        }),
        end: vi.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      const result = await provider.upload('/path/to/file.txt', 'data');

      expect(result.key).toBe('path/to/file.txt');
      expect(mockBucket.file).toHaveBeenCalledWith('path/to/file.txt');
    });

    it('should handle upload errors', async () => {
      const provider = createGCSProvider(mockConfig);
      const mockStream = {
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Upload failed'));
          }
          return mockStream;
        }),
        end: vi.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: false,
        key: 'test-key.txt',
        error: 'Upload failed',
      });
    });

    it('should handle exceptions', async () => {
      const provider = createGCSProvider(mockConfig);
      mockFile.createWriteStream.mockImplementation(() => {
        throw new Error('Stream creation failed');
      });

      const result = await provider.upload('test-key.txt', 'test data');

      expect(result).toEqual({
        success: false,
        key: 'test-key.txt',
        error: 'Stream creation failed',
      });
    });
  });

  describe('download', () => {
    it('should download data successfully', async () => {
      const provider = createGCSProvider(mockConfig);
      const mockBuffer = Buffer.from('test data');
      mockFile.download.mockResolvedValue([mockBuffer]);
      mockFile.getMetadata.mockResolvedValue([{ contentType: 'text/plain' }]);

      const result = await provider.download('test-key.txt');

      expect(result).toEqual({
        success: true,
        data: mockBuffer,
        contentType: 'text/plain',
        size: 9,
      });
    });

    it('should handle missing content type', async () => {
      const provider = createGCSProvider(mockConfig);
      const mockBuffer = Buffer.from('test data');
      mockFile.download.mockResolvedValue([mockBuffer]);
      mockFile.getMetadata.mockResolvedValue([{}]);

      const result = await provider.download('test-key.txt');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.contentType).toBe('application/octet-stream');
      }
    });

    it('should handle download errors', async () => {
      const provider = createGCSProvider(mockConfig);
      mockFile.download.mockRejectedValue(new Error('Download failed'));

      const result = await provider.download('test-key.txt');

      expect(result).toEqual({
        success: false,
        error: 'Download failed',
      });
    });
  });

  describe('getSignedUrl', () => {
    it('should generate signed URL', async () => {
      const provider = createGCSProvider(mockConfig);
      mockFile.getSignedUrl.mockResolvedValue(['https://signed-url.com']);

      const url = await provider.getSignedUrl('test-key.txt', 3600);

      expect(url).toBe('https://signed-url.com');
      expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
        action: 'read',
        expires: expect.any(Number),
      });
    });

    it('should calculate expiry correctly', async () => {
      const provider = createGCSProvider(mockConfig);
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000000);
      mockFile.getSignedUrl.mockResolvedValue(['https://signed-url.com']);

      await provider.getSignedUrl('test-key.txt', 3600);

      expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
        action: 'read',
        expires: 1000000 + 3600 * 1000,
      });
      nowSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should delete object successfully', async () => {
      const provider = createGCSProvider(mockConfig);
      mockFile.delete.mockResolvedValue([]);

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(true);
      expect(mockFile.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle delete errors', async () => {
      const provider = createGCSProvider(mockConfig);
      mockFile.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await provider.delete('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when object exists', async () => {
      const provider = createGCSProvider(mockConfig);
      mockFile.exists.mockResolvedValue([true]);

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(true);
    });

    it('should return false when object does not exist', async () => {
      const provider = createGCSProvider(mockConfig);
      mockFile.exists.mockResolvedValue([false]);

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(false);
    });

    it('should handle errors', async () => {
      const provider = createGCSProvider(mockConfig);
      mockFile.exists.mockRejectedValue(new Error('Check failed'));

      const result = await provider.exists('test-key.txt');

      expect(result).toBe(false);
    });
  });

  describe('list', () => {
    it('should list objects successfully', async () => {
      const provider = createGCSProvider(mockConfig);
      const mockDate = new Date('2024-01-01');
      const mockFiles = [
        {
          name: 'prefix/file1.txt',
          metadata: {
            size: '100',
            updated: mockDate.toISOString(),
            etag: 'etag1',
          },
        },
        {
          name: 'prefix/file2.txt',
          metadata: {
            size: 200,
            timeCreated: mockDate.toISOString(),
            etag: 'etag2',
          },
        },
      ];
      mockStorage.bucket.mockReturnValue({
        ...mockBucket,
        getFiles: vi.fn().mockResolvedValue([mockFiles]),
      });

      const result = await provider.list('prefix/');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: 'prefix/file1.txt',
        size: 100,
        lastModified: mockDate,
        etag: 'etag1',
      });
      expect(result[1]).toEqual({
        key: 'prefix/file2.txt',
        size: 200,
        lastModified: mockDate,
        etag: 'etag2',
      });
    });

    it('should handle list with options', async () => {
      const provider = createGCSProvider(mockConfig);
      mockStorage.bucket.mockReturnValue({
        ...mockBucket,
        getFiles: vi.fn().mockResolvedValue([[]]),
      });

      await provider.list('prefix/', {
        maxKeys: 10,
        continuationToken: 'token',
      });

      expect(mockStorage.bucket().getFiles).toHaveBeenCalledWith({
        prefix: 'prefix/',
        maxResults: 10,
        pageToken: 'token',
      });
    });

    it('should handle empty list', async () => {
      const provider = createGCSProvider(mockConfig);
      mockStorage.bucket.mockReturnValue({
        ...mockBucket,
        getFiles: vi.fn().mockResolvedValue([[]]),
      });

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });

    it('should handle list errors', async () => {
      const provider = createGCSProvider(mockConfig);
      mockStorage.bucket.mockReturnValue({
        ...mockBucket,
        getFiles: vi.fn().mockRejectedValue(new Error('List failed')),
      });

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });

    it('should handle missing file names', async () => {
      const provider = createGCSProvider(mockConfig);
      const mockFiles = [
        {
          metadata: { size: 100 },
        },
      ];
      mockStorage.bucket.mockReturnValue({
        ...mockBucket,
        getFiles: vi.fn().mockResolvedValue([mockFiles]),
      });

      const result = await provider.list('prefix/');

      expect(result[0].key).toBe('');
    });
  });

  describe('testConnection', () => {
    it('should test all permissions successfully', async () => {
      const provider = createGCSProvider(mockConfig);

      // Mock bucket exists
      mockBucket.exists.mockResolvedValue([true]);

      // Mock successful upload
      const mockStream = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockStream;
        }),
        end: vi.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      // Mock successful download
      mockFile.download.mockResolvedValue([Buffer.from('test')]);
      mockFile.getMetadata.mockResolvedValue([{}]);

      // Mock successful delete
      mockFile.delete.mockResolvedValue([]);

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: true,
        canRead: true,
        canWrite: true,
        canDelete: true,
      });
    });

    it('should handle bucket not existing', async () => {
      const provider = createGCSProvider(mockConfig);
      mockBucket.exists.mockResolvedValue([false]);

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: 'Bucket does not exist or is not accessible',
      });
    });

    it('should handle bucket check error', async () => {
      const provider = createGCSProvider(mockConfig);
      mockBucket.exists.mockRejectedValue(new Error('Access denied'));

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: 'Failed to check bucket existence: Access denied',
      });
    });

    it('should handle write failure', async () => {
      const provider = createGCSProvider(mockConfig);
      mockBucket.exists.mockResolvedValue([true]);

      const mockStream = {
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Write failed'));
          }
          return mockStream;
        }),
        end: vi.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: 'Cannot write to bucket: Write failed',
      });
    });

    it('should handle read failure', async () => {
      const provider = createGCSProvider(mockConfig);
      mockBucket.exists.mockResolvedValue([true]);

      // Mock successful upload
      const mockStream = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockStream;
        }),
        end: vi.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      // Mock failed download
      mockFile.download.mockRejectedValue(new Error('Read failed'));

      // Mock delete for cleanup
      mockFile.delete.mockResolvedValue([]);

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: true,
        canDelete: false,
        error: 'Cannot read from bucket: Read failed',
      });
      expect(mockFile.delete).toHaveBeenCalled(); // Cleanup should happen
    });

    it('should handle delete failure', async () => {
      const provider = createGCSProvider(mockConfig);
      mockBucket.exists.mockResolvedValue([true]);

      // Mock successful upload
      const mockStream = {
        on: vi.fn((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockStream;
        }),
        end: vi.fn(),
      };
      mockFile.createWriteStream.mockReturnValue(mockStream);

      // Mock successful download
      mockFile.download.mockResolvedValue([Buffer.from('test')]);
      mockFile.getMetadata.mockResolvedValue([{}]);

      // Mock failed delete
      mockFile.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: true,
        canWrite: true,
        canDelete: false,
        error: 'Cannot delete from bucket',
      });
    });

    it('should handle unexpected errors', async () => {
      const provider = createGCSProvider(mockConfig);
      mockBucket.exists.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await provider.testConnection();

      expect(result).toEqual({
        success: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: 'Failed to check bucket existence: Unexpected error',
      });
    });
  });
});
