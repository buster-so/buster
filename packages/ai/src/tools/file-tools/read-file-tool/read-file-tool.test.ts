import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReadFileToolInput } from './read-file-tool';
import { createReadFileToolExecute } from './read-file-tool-execute';

// Mock Bun global
const mockBunFile = vi.fn();

global.Bun = {
  file: mockBunFile,
} as unknown as typeof Bun;

describe('createReadFilesToolExecute', () => {
  const projectDirectory = '/project';
  const messageId = 'test-message-id';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful file reading', () => {
    it('should read a single file successfully', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockResolvedValue('export const test = "hello";'),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: 'test.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'success',
        file_path: 'test.ts',
        content: 'export const test = "hello";',
        truncated: false,
        lineTruncated: false,
        charTruncated: false,
      });

      expect(mockBunFile).toHaveBeenCalledWith('/project/test.ts');
      expect(mockFile.exists).toHaveBeenCalled();
      expect(mockFile.text).toHaveBeenCalled();
    });

    it('should handle absolute paths correctly', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockResolvedValue('absolute content'),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: '/project/absolute/path.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'success',
        file_path: '/project/absolute/path.ts',
        content: 'absolute content',
        truncated: false,
        lineTruncated: false,
        charTruncated: false,
      });
    });

    it('should truncate files exceeding 1000 lines', async () => {
      // Setup
      const lines = Array.from({ length: 1500 }, (_, i) => `line ${i + 1}`);
      const fullContent = lines.join('\n');
      const expectedContent = lines.slice(0, 1000).join('\n');

      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockResolvedValue(fullContent),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: 'large-file.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'success',
        file_path: 'large-file.ts',
        content: expectedContent,
        truncated: true,
        lineTruncated: true,
        charTruncated: false,
      });
    });

    it('should not truncate files with exactly 1000 lines', async () => {
      // Setup
      const lines = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`);
      const content = lines.join('\n');

      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockResolvedValue(content),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: 'exact-file.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'success',
        file_path: 'exact-file.ts',
        content,
        truncated: false,
        lineTruncated: false,
        charTruncated: false,
      });
    });
  });

  describe('error handling', () => {
    it('should handle file not found errors', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: 'nonexistent.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'error',
        file_path: 'nonexistent.ts',
        error_message: 'File not found',
      });
    });

    it('should handle file read errors gracefully', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockRejectedValue(new Error('Permission denied')),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: 'error.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'error',
        file_path: 'error.ts',
        error_message: 'Permission denied',
      });
    });

    it('should reject paths outside project directory', async () => {
      // Setup
      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: '../outside/project.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error_message).toContain('not in the current working directory');
      }
    });

    it('should reject absolute paths outside project directory', async () => {
      // Setup
      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: '/etc/passwd',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.status).toBe('error');
      if (result.status === 'error') {
        expect(result.error_message).toContain('not in the current working directory');
      }
    });
  });

  describe('path handling', () => {
    it('should handle nested directory paths', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockResolvedValue('export const Button = () => {};'),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: 'src/components/Button.tsx',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'success',
        file_path: 'src/components/Button.tsx',
        content: 'export const Button = () => {};',
        truncated: false,
        lineTruncated: false,
        charTruncated: false,
      });
    });

    it('should normalize paths correctly', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockResolvedValue('utils'),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: './src/../lib/utils.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.status).toBe('success');
    });
  });

  describe('edge cases', () => {
    it('should handle empty file content', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockResolvedValue(''),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: 'empty.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'success',
        file_path: 'empty.ts',
        content: '',
        truncated: false,
        lineTruncated: false,
        charTruncated: false,
      });
    });

    it('should handle file with only newlines', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
        text: vi.fn().mockResolvedValue('\n\n\n'),
      };
      mockBunFile.mockReturnValue(mockFile);

      const execute = createReadFileToolExecute({ messageId, projectDirectory });
      const input: ReadFileToolInput = {
        filePath: 'newlines.ts',
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result).toEqual({
        status: 'success',
        file_path: 'newlines.ts',
        content: '\n\n\n',
        truncated: false,
        lineTruncated: false,
        charTruncated: false,
      });
    });
  });
});
