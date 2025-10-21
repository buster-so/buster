import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WriteFileToolInput } from './write-file-tool';
import { createWriteFileToolExecute } from './write-file-tool-execute';

// Mock Bun global
const mockBunFile = vi.fn();
const mockBunWrite = vi.fn();

global.Bun = {
  file: mockBunFile,
  write: mockBunWrite,
} as unknown as typeof Bun;

describe('createWriteFileToolExecute', () => {
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

  describe('successful file creation', () => {
    it('should create a single new file successfully', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);
      mockBunWrite.mockResolvedValue(undefined);

      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          {
            path: 'test.ts',
            content: 'export const test = "hello";',
          },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: '/project/test.ts',
      });

      expect(mockBunFile).toHaveBeenCalledWith('/project/test.ts');
      expect(mockFile.exists).toHaveBeenCalled();
      expect(mockBunWrite).toHaveBeenCalledWith('/project/test.ts', 'export const test = "hello";');
    });

    it('should overwrite an existing file successfully', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(true),
      };
      mockBunFile.mockReturnValue(mockFile);
      mockBunWrite.mockResolvedValue(undefined);

      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          {
            path: 'existing.ts',
            content: 'updated content',
          },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: '/project/existing.ts',
      });

      expect(mockBunWrite).toHaveBeenCalledWith('/project/existing.ts', 'updated content');
    });

    it('should create multiple files in parallel', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);
      mockBunWrite.mockResolvedValue(undefined);

      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          { path: 'file1.ts', content: 'content1' },
          { path: 'file2.ts', content: 'content2' },
          { path: 'file3.ts', content: 'content3' },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.status === 'success')).toBe(true);
      expect(mockBunWrite).toHaveBeenCalledTimes(3);
    });

    it('should handle absolute paths correctly', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);
      mockBunWrite.mockResolvedValue(undefined);

      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          {
            path: '/project/absolute/path.ts',
            content: 'absolute content',
          },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: '/project/absolute/path.ts',
      });
    });
  });

  describe('error handling', () => {
    it('should handle file write errors gracefully', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);
      mockBunWrite.mockRejectedValue(new Error('Permission denied'));

      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          {
            path: 'error.ts',
            content: 'content',
          },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        filePath: 'error.ts',
        errorMessage: 'Permission denied',
      });
    });

    it('should reject paths outside project directory', async () => {
      // Setup
      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          {
            path: '../outside/project.ts',
            content: 'malicious content',
          },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(1);
      const firstResult = result.results[0];
      if (!firstResult) {
        throw new Error('Expected first result to exist');
      }
      expect(firstResult.status).toBe('error');
      if (firstResult.status === 'error') {
        expect(firstResult.errorMessage).toContain('not in the current working directory');
      }
    });

    it('should handle mixed success and failure', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);
      mockBunWrite
        .mockResolvedValueOnce(undefined) // First succeeds
        .mockRejectedValueOnce(new Error('Write failed')) // Second fails
        .mockResolvedValueOnce(undefined); // Third succeeds

      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          { path: 'success1.ts', content: 'content1' },
          { path: 'failure.ts', content: 'content2' },
          { path: 'success2.ts', content: 'content3' },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(3);
      if (!result.results[0] || !result.results[1] || !result.results[2]) {
        throw new Error('Expected all results to exist');
      }
      expect(result.results[0].status).toBe('success');
      expect(result.results[1].status).toBe('error');
      expect(result.results[2].status).toBe('success');
    });

    it('should reject absolute paths outside project directory', async () => {
      // Setup
      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          {
            path: '/etc/passwd',
            content: 'malicious',
          },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(1);
      const firstResult = result.results[0];
      if (!firstResult) {
        throw new Error('Expected first result to exist');
      }
      expect(firstResult.status).toBe('error');
      if (firstResult.status === 'error') {
        expect(firstResult.errorMessage).toContain('not in the current working directory');
      }
    });
  });

  describe('path handling', () => {
    it('should handle nested directory paths', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);
      mockBunWrite.mockResolvedValue(undefined);

      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          {
            path: 'src/components/Button.tsx',
            content: 'export const Button = () => {};',
          },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: '/project/src/components/Button.tsx',
      });
    });

    it('should normalize paths correctly', async () => {
      // Setup
      const mockFile = {
        exists: vi.fn().mockResolvedValue(false),
      };
      mockBunFile.mockReturnValue(mockFile);
      mockBunWrite.mockResolvedValue(undefined);

      const execute = createWriteFileToolExecute({ messageId, projectDirectory });
      const input: WriteFileToolInput = {
        files: [
          {
            path: './src/../lib/utils.ts',
            content: 'utils',
          },
        ],
      };

      // Execute
      const result = await execute(input);

      // Verify
      const firstResult = result.results[0];
      if (!firstResult) {
        throw new Error('Expected first result to exist');
      }
      expect(firstResult.status).toBe('success');
      expect(firstResult.filePath).toBe('/project/lib/utils.ts');
    });
  });
});
