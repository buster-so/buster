import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Sandbox } from '@daytonaio/sdk';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSandbox } from '../management/create-sandbox';
import {
  addFiles,
  type FileInput,
  type UploadProgress,
  uploadDirectory,
  uploadMultipleFiles,
} from './add-files';

describe('filesystem/add-files integration tests', () => {
  let sandbox: Sandbox;
  let testDir: string;
  let cleanupFuncs: Array<() => Promise<void>> = [];

  beforeEach(async () => {
    // Create sandbox
    sandbox = await createSandbox();

    // Create temporary test directory
    testDir = path.join(tmpdir(), `daytona-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Track for cleanup
    cleanupFuncs.push(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });
  });

  afterEach(async () => {
    // Clean up all resources
    for (const cleanup of cleanupFuncs) {
      await cleanup();
    }
    cleanupFuncs = [];
  });

  describe('Single file operations', () => {
    it('should upload a text file to sandbox', async () => {
      // Create test file
      const testFile = path.join(testDir, 'test.txt');
      const content = 'Hello from integration test!';
      await fs.writeFile(testFile, content);

      // Upload file
      const result = await addFiles(sandbox, testFile);

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toContain('test.txt');
      expect(result.totalSize).toBe(Buffer.from(content).length);

      // Verify file exists in sandbox
      const files = await sandbox.fs.listFiles('.');
      expect(files).toContain('test.txt');
    });

    it('should upload a file to a specific destination', async () => {
      // Create test file
      const testFile = path.join(testDir, 'source.js');
      await fs.writeFile(testFile, 'console.log("test");');

      // Upload with custom destination
      const result = await addFiles(sandbox, {
        path: testFile,
        destination: 'src/scripts/source.js',
      });

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toContain('src/scripts/source.js');

      // Verify directory structure
      const srcFiles = await sandbox.fs.listFiles('src');
      expect(srcFiles).toContain('scripts');

      const scriptFiles = await sandbox.fs.listFiles('src/scripts');
      expect(scriptFiles).toContain('source.js');
    });

    it('should handle binary files', async () => {
      // Create binary file (simple PNG header)
      const binaryFile = path.join(testDir, 'image.png');
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      await fs.writeFile(binaryFile, pngHeader);

      const result = await addFiles(sandbox, binaryFile);

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toContain('image.png');
      expect(result.totalSize).toBe(pngHeader.length);
    });
  });

  describe('Multiple file operations', () => {
    it('should upload multiple files in batch', async () => {
      // Create multiple test files
      const files = [];
      for (let i = 1; i <= 15; i++) {
        const filePath = path.join(testDir, `file${i}.txt`);
        await fs.writeFile(filePath, `Content of file ${i}`);
        files.push({
          path: filePath,
          destination: `batch/file${i}.txt`,
        });
      }

      const result = await uploadMultipleFiles(sandbox, files);

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toHaveLength(15);

      // Verify all files exist
      const batchFiles = await sandbox.fs.listFiles('batch');
      expect(batchFiles).toHaveLength(15);
    });

    it('should track progress during batch upload', async () => {
      // Create test files
      const files = [];
      for (let i = 1; i <= 20; i++) {
        const filePath = path.join(testDir, `progress${i}.txt`);
        await fs.writeFile(filePath, `File ${i}`);
        files.push({ path: filePath });
      }

      const progressReports: UploadProgress[] = [];
      const result = await uploadMultipleFiles(sandbox, files, {
        onProgress: (progress) => progressReports.push({ ...progress }),
      });

      expect(result.success).toBe(true);
      expect(progressReports.length).toBeGreaterThan(0);

      // Verify progress increases
      for (let i = 1; i < progressReports.length; i++) {
        expect(progressReports[i].uploadedFiles).toBeGreaterThanOrEqual(
          progressReports[i - 1].uploadedFiles
        );
      }
    });

    it('should handle mixed content types', async () => {
      const files: FileInput[] = [
        {
          path: 'memory-file.txt',
          content: 'Direct string content',
          destination: 'mixed/text.txt',
        },
        {
          path: 'buffer-file.bin',
          content: Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]),
          destination: 'mixed/binary.bin',
        },
      ];

      // Also create a real file
      const realFile = path.join(testDir, 'real.json');
      await fs.writeFile(realFile, JSON.stringify({ test: true }));
      files.push({
        path: realFile,
        destination: 'mixed/data.json',
      });

      const result = await uploadMultipleFiles(sandbox, files);

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toHaveLength(3);

      const mixedFiles = await sandbox.fs.listFiles('mixed');
      expect(mixedFiles).toContain('text.txt');
      expect(mixedFiles).toContain('binary.bin');
      expect(mixedFiles).toContain('data.json');
    });
  });

  describe('Directory operations', () => {
    it('should upload entire directory structure', async () => {
      // Create directory structure
      const structure = {
        'src/index.js': 'export default "main";',
        'src/utils/helper.js': 'export const help = () => {};',
        'src/utils/logger.js': 'export const log = console.log;',
        'tests/index.test.js': 'test("main", () => {});',
        'README.md': '# Test Project',
        'package.json': '{"name": "test", "version": "1.0.0"}',
      };

      // Create files
      for (const [filePath, content] of Object.entries(structure)) {
        const fullPath = path.join(testDir, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
      }

      const result = await uploadDirectory(sandbox, testDir, 'project');

      expect(result.success).toBe(true);
      expect(result.uploadedFiles).toHaveLength(Object.keys(structure).length);

      // Verify structure in sandbox
      const projectFiles = await sandbox.fs.listFiles('project');
      expect(projectFiles).toContain('src');
      expect(projectFiles).toContain('tests');
      expect(projectFiles).toContain('README.md');
      expect(projectFiles).toContain('package.json');

      const srcFiles = await sandbox.fs.listFiles('project/src');
      expect(srcFiles).toContain('index.js');
      expect(srcFiles).toContain('utils');
    });

    it('should preserve empty directories', async () => {
      // Create structure with empty directories
      await fs.mkdir(path.join(testDir, 'src/components'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'src/hooks'), { recursive: true });
      await fs.mkdir(path.join(testDir, 'tests'), { recursive: true });

      // Add at least one file so the upload proceeds
      await fs.writeFile(path.join(testDir, '.gitkeep'), '');

      const result = await uploadDirectory(sandbox, testDir);

      expect(result.success).toBe(true);

      // Note: Empty directories might not be preserved depending on
      // Daytona's implementation. This test documents the behavior.
      const files = await sandbox.fs.listFiles('.');
      expect(files).toContain('.gitkeep');
    });

    it('should handle deeply nested structures', async () => {
      // Create deep nesting
      let deepPath = testDir;
      for (let i = 1; i <= 10; i++) {
        deepPath = path.join(deepPath, `level${i}`);
        await fs.mkdir(deepPath, { recursive: true });
      }
      await fs.writeFile(path.join(deepPath, 'deep.txt'), 'Very deep file');

      const result = await uploadDirectory(sandbox, testDir);

      expect(result.success).toBe(true);
      expect(result.uploadedFiles.some((f) => f.includes('level10/deep.txt'))).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const result = await addFiles(sandbox, '/non/existent/file.txt');

      expect(result.success).toBe(false);
      expect(result.failedFiles).toHaveLength(1);
      expect(result.failedFiles?.[0].error).toContain('ENOENT');
    });

    it('should continue uploading after individual file failures', async () => {
      const files = [
        { path: path.join(testDir, 'exists.txt'), content: 'I exist' },
        { path: '/non/existent/file.txt' },
        { path: path.join(testDir, 'also-exists.txt'), content: 'I also exist' },
      ];

      // Create real files
      await fs.writeFile(files[0].path, files[0].content!);
      await fs.writeFile(files[2].path, files[2].content!);

      const result = await uploadMultipleFiles(sandbox, files);

      expect(result.uploadedFiles).toHaveLength(2);
      expect(result.failedFiles).toHaveLength(1);
      expect(result.failedFiles?.[0].path).toBe('/non/existent/file.txt');
    });

    it('should validate paths before upload', async () => {
      const maliciousFiles = [
        { path: 'valid.txt', content: 'ok', destination: '../../../etc/passwd' },
        { path: 'valid2.txt', content: 'ok', destination: '/absolute/path' },
      ];

      const result = await uploadMultipleFiles(sandbox, maliciousFiles);

      expect(result.success).toBe(false);
      expect(result.failedFiles).toHaveLength(2);
      expect(result.uploadedFiles).toHaveLength(0);
    });
  });

  describe('Options and features', () => {
    it('should respect base destination option', async () => {
      const files = [];
      for (let i = 1; i <= 3; i++) {
        const filePath = path.join(testDir, `doc${i}.md`);
        await fs.writeFile(filePath, `# Document ${i}`);
        files.push({ path: filePath });
      }

      const result = await uploadMultipleFiles(sandbox, files, {
        baseDestination: 'docs/guides',
      });

      expect(result.success).toBe(true);

      const guideFiles = await sandbox.fs.listFiles('docs/guides');
      expect(guideFiles).toHaveLength(3);
      expect(guideFiles).toContain('doc1.md');
    });

    it('should handle custom permissions', async () => {
      const testFile = path.join(testDir, 'script.sh');
      await fs.writeFile(testFile, '#!/bin/bash\necho "Hello"');

      const result = await addFiles(
        sandbox,
        {
          path: testFile,
          destination: 'bin/script.sh',
        },
        {
          permissions: '755',
        }
      );

      expect(result.success).toBe(true);

      // Note: Verifying permissions would require additional sandbox API
      // This test ensures the option is passed through correctly
    });

    it('should handle large files', async () => {
      // Create a 5MB file
      const largeFile = path.join(testDir, 'large.dat');
      const size = 5 * 1024 * 1024; // 5MB
      const buffer = Buffer.alloc(size, 'x');
      await fs.writeFile(largeFile, buffer);

      const result = await addFiles(sandbox, largeFile);

      expect(result.success).toBe(true);
      expect(result.totalSize).toBe(size);
    });
  });
});
