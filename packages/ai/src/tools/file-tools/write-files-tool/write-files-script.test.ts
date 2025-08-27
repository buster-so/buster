import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('write-files-script', () => {
  const scriptPath = path.join(__dirname, 'write-files-script.ts');
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'write-files-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  async function runScript(args: string[]): Promise<{ stdout: string; stderr: string }> {
    // Properly escape arguments for shell
    const escapedArgs = args.map((arg) => {
      // If it contains special characters, wrap in single quotes
      if (arg.includes(' ') || arg.includes('"') || arg.includes('[') || arg.includes(']')) {
        return `'${arg.replace(/'/g, "'\"'\"'")}'`;
      }
      return arg;
    });
    const { stdout, stderr } = await exec(`npx tsx ${scriptPath} ${escapedArgs.join(' ')}`);
    return { stdout, stderr };
  }

  describe('functional tests', () => {
    it('should create a single file successfully', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      const fileParams = [
        {
          path: testFile,
          content: 'Hello, world!',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          filePath: testFile,
        },
      ]);

      // Verify file was created
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Hello, world!');
    });

    it('should create multiple files', async () => {
      const fileParams = [
        { path: path.join(tempDir, 'file1.txt'), content: 'Content 1' },
        { path: path.join(tempDir, 'file2.txt'), content: 'Content 2' },
        { path: path.join(tempDir, 'file3.txt'), content: 'Content 3' },
      ];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(3);
      expect(results.every((r: any) => r.success)).toBe(true);

      // Verify all files were created
      for (const param of fileParams) {
        const content = await fs.readFile(param.path, 'utf-8');
        expect(content).toBe(param.content);
      }
    });

    it('should create directories if they do not exist', async () => {
      const nestedFile = path.join(tempDir, 'nested', 'deep', 'file.txt');
      const fileParams = [
        {
          path: nestedFile,
          content: 'Nested content',
        },
      ];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);

      // Verify file and directories were created
      const content = await fs.readFile(nestedFile, 'utf-8');
      expect(content).toBe('Nested content');
    });

    it('should handle relative paths', async () => {
      const originalCwd = process.cwd();
      try {
        // Change to temp directory
        process.chdir(tempDir);

        const fileParams = [
          { path: 'relative.txt', content: 'Relative content' },
          { path: './subdir/file.txt', content: 'Subdir content' },
        ];

        const { stdout } = await runScript([JSON.stringify(fileParams)]);
        const results = JSON.parse(stdout);

        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(true);

        // Verify files were created
        expect(await fs.readFile('relative.txt', 'utf-8')).toBe('Relative content');
        expect(await fs.readFile('./subdir/file.txt', 'utf-8')).toBe('Subdir content');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle base64 encoded input', async () => {
      const testFile = path.join(tempDir, 'base64.txt');
      const fileParams = [{ path: testFile, content: 'Base64 content' }];
      const base64Input = Buffer.from(JSON.stringify(fileParams)).toString('base64');

      const { stdout } = await runScript([base64Input]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Base64 content');
    });

    it('should handle empty content', async () => {
      const testFile = path.join(tempDir, 'empty.txt');
      const fileParams = [{ path: testFile, content: '' }];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('');
    });

    it('should handle special characters in content', async () => {
      const testFile = path.join(tempDir, 'special.txt');
      const specialContent =
        'Special chars: @#$%^&*()\n"Quotes"\n\'Apostrophes\'\n\tTabs\n\\Backslashes\\';
      const fileParams = [{ path: testFile, content: specialContent }];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe(specialContent);
    });

    it('should handle multiline content', async () => {
      const testFile = path.join(tempDir, 'multiline.txt');
      const multilineContent = `Line 1
Line 2
Line 3

Line 5 (after empty line)`;
      const fileParams = [{ path: testFile, content: multilineContent }];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe(multilineContent);
    });

    it('should handle files with spaces in names', async () => {
      const testFile = path.join(tempDir, 'file with spaces.txt');
      const fileParams = [{ path: testFile, content: 'Content with spaces' }];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Content with spaces');
    });

    it('should handle no arguments', async () => {
      try {
        await runScript([]);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Script exits with code 1
        const results = JSON.parse(error.stdout);
        expect(results).toEqual([
          {
            success: false,
            filePath: '',
            error: 'No arguments provided to script',
          },
        ]);
      }
    });

    it('should handle invalid JSON', async () => {
      try {
        await runScript(['not valid json']);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Script exits with code 1
        const results = JSON.parse(error.stdout);
        expect(results[0].success).toBe(false);
        expect(results[0].error).toContain('Failed to parse arguments');
      }
    });

    it('should handle non-array input', async () => {
      try {
        await runScript(['{"not": "array"}']);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Script exits with code 1
        const results = JSON.parse(error.stdout);
        expect(results[0].success).toBe(false);
        expect(results[0].error).toContain('File parameters must be an array');
      }
    });

    it('should handle missing path', async () => {
      const fileParams = [{ content: 'No path provided' }];
      try {
        await runScript([JSON.stringify(fileParams)]);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Script exits with code 1
        const results = JSON.parse(error.stdout);
        expect(results[0].success).toBe(false);
        expect(results[0].error).toContain('must have a valid path string');
      }
    });

    it('should handle missing content', async () => {
      const fileParams = [{ path: 'test.txt' }];
      try {
        await runScript([JSON.stringify(fileParams)]);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Script exits with code 1
        const results = JSON.parse(error.stdout);
        expect(results[0].success).toBe(false);
        expect(results[0].error).toContain('must have a content string');
      }
    });

    it('should handle mixed success and failure', async () => {
      const file1 = path.join(tempDir, 'success.txt');
      const file2 = path.join(tempDir, 'readonly', 'fail.txt');

      // Create a readonly directory
      const readonlyDir = path.join(tempDir, 'readonly');
      await fs.mkdir(readonlyDir);
      await fs.chmod(readonlyDir, 0o444);

      const fileParams = [
        { path: file1, content: 'Success' },
        { path: file2, content: 'This will fail' },
      ];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);

      // Verify successful file was created
      const content = await fs.readFile(file1, 'utf-8');
      expect(content).toBe('Success');

      // Clean up
      await fs.chmod(readonlyDir, 0o755);
    });

    it('should avoid creating duplicate directories', async () => {
      // Multiple files in the same directory
      const fileParams = [
        { path: path.join(tempDir, 'same-dir', 'file1.txt'), content: 'File 1' },
        { path: path.join(tempDir, 'same-dir', 'file2.txt'), content: 'File 2' },
        { path: path.join(tempDir, 'same-dir', 'file3.txt'), content: 'File 3' },
      ];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(3);
      expect(results.every((r: any) => r.success)).toBe(true);

      // Verify all files were created
      for (const param of fileParams) {
        const content = await fs.readFile(param.path, 'utf-8');
        expect(content).toBe(param.content);
      }
    });

    it('should handle UTF-8 content', async () => {
      const testFile = path.join(tempDir, 'utf8.txt');
      const utf8Content = '你好世界 🌍 Émojis and special chars: €£¥';
      const fileParams = [{ path: testFile, content: utf8Content }];

      const { stdout } = await runScript([JSON.stringify(fileParams)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe(utf8Content);
    });
  });
});
