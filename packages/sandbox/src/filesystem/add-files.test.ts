import { promises as fs } from 'node:fs';
import type { Sandbox } from '@daytonaio/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addFiles,
  type FileInput,
  joinPaths,
  normalizePath,
  type UploadOptions,
  uploadDirectory,
  uploadMultipleFiles,
  uploadSingleFile,
  validatePath,
} from './add-files';

// Mock node:fs
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

describe('filesystem/add-files', () => {
  let mockSandbox: Sandbox;

  beforeEach(() => {
    // Create mock sandbox
    mockSandbox = {
      fs: {
        createFolder: vi.fn().mockResolvedValue(undefined),
        uploadFile: vi.fn().mockResolvedValue(undefined),
        uploadFiles: vi.fn().mockResolvedValue(undefined),
      },
    } as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Path utilities', () => {
    describe('normalizePath', () => {
      it('should normalize Windows paths to Unix paths', () => {
        expect(normalizePath('path\\to\\file')).toBe('path/to/file');
        expect(normalizePath('C:\\Users\\test')).toBe('C:/Users/test');
      });

      it('should remove duplicate slashes', () => {
        expect(normalizePath('path//to///file')).toBe('path/to/file');
        expect(normalizePath('//leading//double')).toBe('/leading/double');
      });
    });

    describe('joinPaths', () => {
      it('should join paths correctly', () => {
        expect(joinPaths('base', 'path', 'file.txt')).toBe('base/path/file.txt');
        expect(joinPaths('/root', 'sub', 'file')).toBe('/root/sub/file');
      });

      it('should handle empty segments', () => {
        expect(joinPaths('base', '', 'file')).toBe('base/file');
        expect(joinPaths('', 'path', '')).toBe('path');
      });
    });

    describe('validatePath', () => {
      it('should accept valid paths', () => {
        expect(() => validatePath('valid/path')).not.toThrow();
        expect(() => validatePath('file.txt')).not.toThrow();
        expect(() => validatePath('sub/folder/file.js')).not.toThrow();
      });

      it('should reject invalid paths', () => {
        expect(() => validatePath('')).toThrow('Invalid path: path must be a non-empty string');
        expect(() => validatePath(null as any)).toThrow(
          'Invalid path: path must be a non-empty string'
        );
        expect(() => validatePath(undefined as any)).toThrow(
          'Invalid path: path must be a non-empty string'
        );
      });

      it('should reject path traversal attempts', () => {
        expect(() => validatePath('../parent')).toThrow(
          'Invalid path: path traversal or absolute paths not allowed'
        );
        expect(() => validatePath('path/../../../etc')).toThrow(
          'Invalid path: path traversal or absolute paths not allowed'
        );
        expect(() => validatePath('/absolute/path')).toThrow(
          'Invalid path: path traversal or absolute paths not allowed'
        );
      });
    });
  });

  describe('uploadSingleFile', () => {
    it('should upload a single file successfully', async () => {
      const mockContent = Buffer.from('file content');
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await uploadSingleFile(mockSandbox, '/local/file.txt', 'remote/file.txt');

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toEqual(['remote/file.txt']);
      expect(result.totalSize).toBe(mockContent.length);
      expect(mockSandbox.fs.createFolder).toHaveBeenCalledWith('remote', '755');
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledWith(mockContent, 'remote/file.txt');
    });

    it('should handle file read errors', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      const result = await uploadSingleFile(
        mockSandbox,
        '/local/missing.txt',
        'remote/missing.txt'
      );

      expect(result.success).toBe(false);
      expect(result.uploadedFiles).toEqual([]);
      expect(result.failedFiles).toEqual([
        {
          path: '/local/missing.txt',
          error: 'File not found',
        },
      ]);
    });

    it('should use base destination if provided', async () => {
      const mockContent = Buffer.from('content');
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await uploadSingleFile(mockSandbox, '/local/file.txt', 'file.txt', {
        baseDestination: 'base/dir',
      });

      expect(result.uploadedFiles).toEqual(['base/dir/file.txt']);
      expect(mockSandbox.fs.createFolder).toHaveBeenCalledWith('base/dir', '755');
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files successfully', async () => {
      const files: FileInput[] = [
        { path: 'file1.txt', content: 'content1' },
        { path: 'file2.txt', content: Buffer.from('content2') },
        { path: 'file3.txt', destination: 'custom/file3.txt' },
      ];

      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('content3'));

      const result = await uploadMultipleFiles(mockSandbox, files);

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toHaveLength(3);
      expect(mockSandbox.fs.uploadFiles).toHaveBeenCalled();
    });

    it('should handle batch upload failures by falling back to individual uploads', async () => {
      const files: FileInput[] = [
        { path: 'file1.txt', content: 'content1' },
        { path: 'file2.txt', content: 'content2' },
      ];

      // Mock batch upload to fail
      vi.mocked(mockSandbox.fs.uploadFiles).mockRejectedValue(new Error('Batch failed'));

      const result = await uploadMultipleFiles(mockSandbox, files);

      // Should fall back to individual uploads
      expect(mockSandbox.fs.uploadFile).toHaveBeenCalledTimes(2);
      expect(result.uploadedFiles).toHaveLength(2);
    });

    it('should create directories in correct order', async () => {
      const files: FileInput[] = [
        { path: 'file1.txt', destination: 'a/b/c/file1.txt' },
        { path: 'file2.txt', destination: 'a/file2.txt' },
        { path: 'file3.txt', destination: 'a/b/file3.txt' },
      ];

      await uploadMultipleFiles(mockSandbox, files);

      // Verify directories are created in order of depth
      const createFolderCalls = vi.mocked(mockSandbox.fs.createFolder).mock.calls;
      expect(createFolderCalls[0][0]).toBe('a');
      expect(createFolderCalls[1][0]).toBe('a/b');
      expect(createFolderCalls[2][0]).toBe('a/b/c');
    });

    it('should report progress correctly', async () => {
      const files: FileInput[] = Array.from({ length: 25 }, (_, i) => ({
        path: `file${i}.txt`,
        content: `content${i}`,
      }));

      const progressReports: any[] = [];
      const options: UploadOptions = {
        onProgress: (progress) => progressReports.push({ ...progress }),
      };

      await uploadMultipleFiles(mockSandbox, files, options);

      expect(progressReports.length).toBeGreaterThan(0);
      expect(progressReports[0].totalFiles).toBe(25);
      expect(progressReports[progressReports.length - 1].percentage).toBe(100);
    });
  });

  describe('uploadDirectory', () => {
    it('should upload directory structure', async () => {
      // Mock directory structure
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdir)
        .mockResolvedValueOnce([
          { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
          { name: 'subdir', isDirectory: () => true, isFile: () => false },
        ] as any)
        .mockResolvedValueOnce([
          { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
        ] as any);

      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('content'));

      const result = await uploadDirectory(mockSandbox, '/local/dir');

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toContain('file1.txt');
      expect(result.uploadedFiles).toContain('subdir/file2.txt');
    });

    it('should handle non-directory paths', async () => {
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => false } as any);

      const result = await uploadDirectory(mockSandbox, '/local/file.txt');

      expect(result.success).toBe(false);
      expect(result.failedFiles?.[0].error).toContain('is not a directory');
    });

    it('should use custom destination', async () => {
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdir).mockResolvedValueOnce([
        { name: 'file.txt', isDirectory: () => false, isFile: () => true },
      ] as any);
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('content'));

      const result = await uploadDirectory(mockSandbox, '/local/dir', 'remote/dest');

      expect(result.uploadedFiles).toContain('remote/dest/file.txt');
    });
  });

  describe('addFiles (main API)', () => {
    it('should handle string path for file', async () => {
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => false } as any);
      vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('content'));

      const result = await addFiles(mockSandbox, '/path/to/file.txt');

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toContain('file.txt');
    });

    it('should handle string path for directory', async () => {
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdir).mockResolvedValueOnce([]);

      const result = await addFiles(mockSandbox, '/path/to/dir');

      expect(result.success).toBe(true);
    });

    it('should handle FileInput with content', async () => {
      const input: FileInput = {
        path: 'test.txt',
        content: 'test content',
        destination: 'dest/test.txt',
      };

      const result = await addFiles(mockSandbox, input);

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toContain('dest/test.txt');
    });

    it('should handle array of FileInput', async () => {
      const inputs: FileInput[] = [
        { path: 'file1.txt', content: 'content1' },
        { path: 'file2.txt', content: 'content2' },
      ];

      const result = await addFiles(mockSandbox, inputs);

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toHaveLength(2);
    });

    it('should handle DirectoryInput', async () => {
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readdir).mockResolvedValueOnce([]);

      const input = {
        path: '/local/dir',
        destination: 'remote/dir',
      };

      const result = await addFiles(mockSandbox, input);

      expect(result.success).toBe(true);
    });

    it('should throw for invalid input', async () => {
      await expect(addFiles(mockSandbox, {} as any)).rejects.toThrow('Invalid input');
      await expect(addFiles(mockSandbox, 123 as any)).rejects.toThrow('Invalid input');
    });
  });
});
