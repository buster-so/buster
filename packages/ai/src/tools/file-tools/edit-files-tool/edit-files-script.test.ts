import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('edit-files-script', () => {
  const scriptPath = path.join(__dirname, 'edit-files-script.ts');
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-files-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  async function runScript(
    args: string[],
    expectFailure = false
  ): Promise<{ stdout: string; stderr: string }> {
    // Properly escape arguments for shell
    const escapedArgs = args.map((arg) => {
      // If it contains special characters, wrap in single quotes
      if (arg.includes(' ') || arg.includes('"') || arg.includes('[') || arg.includes(']')) {
        return `'${arg.replace(/'/g, "'\"'\"'")}'`;
      }
      return arg;
    });

    try {
      const { stdout, stderr } = await exec(`npx tsx ${scriptPath} ${escapedArgs.join(' ')}`);
      return { stdout, stderr };
    } catch (error: unknown) {
      if (expectFailure && error && typeof error === 'object' && 'stdout' in error) {
        // When we expect failure, return the stdout/stderr from the error
        return {
          stdout: (error as { stdout: string }).stdout,
          stderr: (error as { stderr?: string }).stderr || '',
        };
      }
      throw error;
    }
  }

  describe('functional tests', () => {
    it('should edit a single file successfully', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Hello world! This is a test.');

      // Run the script
      const edits = [
        {
          filePath: testFile,
          findString: 'Hello world!',
          replaceString: 'Hi there!',
        },
      ];
      const { stdout } = await runScript([JSON.stringify(edits)]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          filePath: testFile,
          message: `Successfully replaced "Hello world!" with "Hi there!" in ${testFile}`,
        },
      ]);

      // Verify file content was changed
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Hi there! This is a test.');
    });

    it('should handle file not found', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

      // Run the script
      const edits = [
        {
          filePath: nonExistentFile,
          findString: 'test',
          replaceString: 'replaced',
        },
      ];
      const { stdout } = await runScript([JSON.stringify(edits)], true);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: false,
          filePath: nonExistentFile,
          error: 'File not found',
        },
      ]);
    });

    it('should handle multiple edits', async () => {
      // Create test files
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      const file3 = path.join(tempDir, 'file3.txt');

      await fs.writeFile(file1, 'The quick brown fox');
      await fs.writeFile(file2, 'jumps over the lazy dog');
      await fs.writeFile(file3, 'The end.');

      // Run the script
      const edits = [
        { filePath: file1, findString: 'quick', replaceString: 'slow' },
        { filePath: file2, findString: 'lazy', replaceString: 'active' },
        { filePath: file3, findString: 'end', replaceString: 'beginning' },
      ];
      const { stdout } = await runScript([JSON.stringify(edits)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(3);
      expect(results.every((r: any) => r.success)).toBe(true);

      // Verify all files were edited
      expect(await fs.readFile(file1, 'utf-8')).toBe('The slow brown fox');
      expect(await fs.readFile(file2, 'utf-8')).toBe('jumps over the active dog');
      expect(await fs.readFile(file3, 'utf-8')).toBe('The beginning.');
    });

    it('should handle JSON array input', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Original content');

      // Run the script with JSON array
      const edits = [{ filePath: testFile, findString: 'Original', replaceString: 'Modified' }];
      const { stdout } = await runScript([JSON.stringify(edits)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ success: true });
      expect(await fs.readFile(testFile, 'utf-8')).toBe('Modified content');
    });

    it('should handle base64 encoded input', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Base64 test');

      // Run the script with base64 encoded JSON
      const edits = [{ filePath: testFile, findString: 'test', replaceString: 'example' }];
      const base64Input = Buffer.from(JSON.stringify(edits)).toString('base64');
      const { stdout } = await runScript([base64Input]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({ success: true });
      expect(await fs.readFile(testFile, 'utf-8')).toBe('Base64 example');
    });

    it('should error when find string not found', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Hello world');

      // Run the script
      const edits = [{ filePath: testFile, findString: 'Goodbye', replaceString: 'Hi' }];
      const { stdout } = await runScript([JSON.stringify(edits)], true);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: false,
          filePath: testFile,
          error: 'Find string not found in file: "Goodbye"',
        },
      ]);

      // Verify file was not changed
      expect(await fs.readFile(testFile, 'utf-8')).toBe('Hello world');
    });

    it('should error when find string appears multiple times', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test test test');

      // Run the script
      const edits = [{ filePath: testFile, findString: 'test', replaceString: 'replaced' }];
      const { stdout } = await runScript([JSON.stringify(edits)], true);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('appears 3 times');

      // Verify file was not changed
      expect(await fs.readFile(testFile, 'utf-8')).toBe('test test test');
    });

    it('should handle relative paths', async () => {
      const originalCwd = process.cwd();
      try {
        // Change to temp directory
        process.chdir(tempDir);

        // Create a test file
        await fs.writeFile('relative.txt', 'relative content');

        // Run the script with relative path
        const edits = [
          { filePath: 'relative.txt', findString: 'relative', replaceString: 'absolute' },
        ];
        const { stdout } = await runScript([JSON.stringify(edits)]);
        const results = JSON.parse(stdout);

        expect(results).toEqual([
          {
            success: true,
            filePath: 'relative.txt',
            message: 'Successfully replaced "relative" with "absolute" in relative.txt',
          },
        ]);

        // Verify file was edited
        expect(await fs.readFile('relative.txt', 'utf-8')).toBe('absolute content');
      } finally {
        process.chdir(originalCwd);
      }
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

    it('should handle files with spaces in names', async () => {
      // Create a file with spaces
      const testFile = path.join(tempDir, 'file with spaces.txt');
      await fs.writeFile(testFile, 'content with spaces');

      // Run the script - escaping is handled by runScript
      const edits = [{ filePath: testFile, findString: 'content', replaceString: 'text' }];
      const { stdout } = await runScript([JSON.stringify(edits)]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          filePath: testFile,
          message: `Successfully replaced "content" with "text" in ${testFile}`,
        },
      ]);

      // Verify file was edited
      expect(await fs.readFile(testFile, 'utf-8')).toBe('text with spaces');
    });

    it('should handle special characters in find/replace strings', async () => {
      // Create a file with special characters
      const testFile = path.join(tempDir, 'special.txt');
      const specialContent = 'function test() { return "value"; }';
      await fs.writeFile(testFile, specialContent);

      // Run the script
      const edits = [
        {
          filePath: testFile,
          findString: 'function test() {',
          replaceString: 'const test = () => {',
        },
      ];
      const { stdout } = await runScript([JSON.stringify(edits)]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          filePath: testFile,
          message: `Successfully replaced "function test() {" with "const test = () => {" in ${testFile}`,
        },
      ]);

      expect(await fs.readFile(testFile, 'utf-8')).toBe('const test = () => { return "value"; }');
    });

    it('should handle empty replacement string', async () => {
      // Create test file
      const testFile = path.join(tempDir, 'remove.txt');
      await fs.writeFile(testFile, 'Keep this REMOVE_ME and this');

      // Run the script
      const edits = [{ filePath: testFile, findString: 'REMOVE_ME ', replaceString: '' }];
      const { stdout } = await runScript([JSON.stringify(edits)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(await fs.readFile(testFile, 'utf-8')).toBe('Keep this and this');
    });

    it('should handle mixed success and failure', async () => {
      // Create test files
      const file1 = path.join(tempDir, 'exists.txt');
      const file2 = path.join(tempDir, 'missing.txt');

      await fs.writeFile(file1, 'Hello world');

      // Run the script
      const edits = [
        { filePath: file1, findString: 'Hello', replaceString: 'Hi' },
        { filePath: file2, findString: 'test', replaceString: 'replaced' },
      ];
      const { stdout } = await runScript([JSON.stringify(edits)], true);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('File not found');

      // Verify successful edit
      expect(await fs.readFile(file1, 'utf-8')).toBe('Hi world');
    });

    it('should handle invalid JSON input', async () => {
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

    it('should handle missing required fields', async () => {
      const edits = [
        {
          filePath: 'test.txt',
          findString: 'test',
          // missing replaceString
        },
      ];
      try {
        await runScript([JSON.stringify(edits)]);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Script exits with code 1
        const results = JSON.parse(error.stdout);
        expect(results[0].success).toBe(false);
        expect(results[0].error).toContain(
          'Each edit must have filePath, findString, and replaceString'
        );
      }
    });
  });
});
