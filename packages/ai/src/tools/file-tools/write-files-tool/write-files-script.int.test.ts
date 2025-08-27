import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

// Helper to execute script with clean stderr
async function runScript(args: string) {
  const { stdout, stderr } = await execAsync(
    `npx tsx ${path.join(__dirname, 'write-files-script.ts')} ${args}`,
    { env: { ...process.env, npm_config_loglevel: 'error' } }
  );

  // Filter out npm warnings
  const cleanStderr = stderr
    .split('\n')
    .filter((line) => !line.includes('npm warn') && line.trim() !== '')
    .join('\n');

  return { stdout, stderr: cleanStderr };
}

describe('write-files-script integration tests', () => {
  let tempDir: string;
  const scriptPath = path.join(__dirname, 'write-files-script.ts');

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'write-files-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should create single file successfully', async () => {
    const testFile = path.join(tempDir, 'test.txt');
    const fileParams = [{ path: testFile, content: 'Hello, World!' }];

    const { stdout, stderr } = await runScript(`'${JSON.stringify(fileParams)}'`);

    expect(stderr).toBe('');
    const results = JSON.parse(stdout);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      success: true,
      filePath: testFile,
    });

    // Verify file was actually created
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toBe('Hello, World!');
  });

  it('should create multiple files successfully', async () => {
    const files = [
      { path: path.join(tempDir, 'file1.txt'), content: 'Content 1' },
      { path: path.join(tempDir, 'file2.txt'), content: 'Content 2' },
      { path: path.join(tempDir, 'subdir', 'file3.txt'), content: 'Content 3' },
    ];

    const { stdout, stderr } = await runScript(`'${JSON.stringify(files)}'`);

    expect(stderr).toBe('');
    const results = JSON.parse(stdout);
    expect(results).toHaveLength(3);

    // Verify all files were created
    for (let i = 0; i < files.length; i++) {
      expect(results[i].success).toBe(true);
      const content = await fs.readFile(files[i]!.path, 'utf-8');
      expect(content).toBe(files[i]!.content);
    }

    // Verify subdirectory was created
    const subdirStats = await fs.stat(path.join(tempDir, 'subdir'));
    expect(subdirStats.isDirectory()).toBe(true);
  });

  it('should handle relative paths correctly', async () => {
    const originalCwd = process.cwd();
    process.chdir(tempDir);

    try {
      const fileParams = [
        { path: 'relative.txt', content: 'Relative content' },
        { path: './subdir/nested.txt', content: 'Nested content' },
      ];

      const { stdout, stderr } = await runScript(`'${JSON.stringify(fileParams)}'`);

      expect(stderr).toBe('');
      const results = JSON.parse(stdout);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      // Verify files were created at correct locations
      const relativeContent = await fs.readFile(path.join(tempDir, 'relative.txt'), 'utf-8');
      expect(relativeContent).toBe('Relative content');

      const nestedContent = await fs.readFile(path.join(tempDir, 'subdir', 'nested.txt'), 'utf-8');
      expect(nestedContent).toBe('Nested content');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should overwrite existing files', async () => {
    const testFile = path.join(tempDir, 'existing.txt');
    await fs.writeFile(testFile, 'Original content');

    const fileParams = [{ path: testFile, content: 'New content' }];

    const { stdout, stderr } = await runScript(`'${JSON.stringify(fileParams)}'`);

    expect(stderr).toBe('');
    const results = JSON.parse(stdout);
    expect(results[0].success).toBe(true);

    // Verify file was overwritten
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toBe('New content');
  });

  it('should handle special characters in content', async () => {
    const testFile = path.join(tempDir, 'special.txt');
    const specialContent = 'Line 1\nLine 2\tTabbed\r\nWindows line\n"Quoted"\nSingle';
    const fileParams = [{ path: testFile, content: specialContent }];

    const { stdout, stderr } = await runScript(`'${JSON.stringify(fileParams)}'`);

    expect(stderr).toBe('');
    const results = JSON.parse(stdout);
    expect(results[0].success).toBe(true);

    // Verify content with special characters
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toBe(specialContent);
  });

  it('should handle errors gracefully', async () => {
    // Try to create a file in a non-existent absolute path
    const invalidPath = '/this/path/should/not/exist/file.txt';
    const fileParams = [{ path: invalidPath, content: 'Content' }];

    const { stdout, stderr } = await runScript(`'${JSON.stringify(fileParams)}'`);

    expect(stderr).toBe('');
    const results = JSON.parse(stdout);
    expect(results[0].success).toBe(false);
    expect(results[0].filePath).toBe(invalidPath);
    expect(results[0].error).toBeTruthy();
  });

  it('should handle mixed success and failure', async () => {
    const files = [
      { path: path.join(tempDir, 'success1.txt'), content: 'Success 1' },
      { path: '/invalid/path/fail.txt', content: 'Will fail' },
      { path: path.join(tempDir, 'success2.txt'), content: 'Success 2' },
    ];

    const { stdout, stderr } = await runScript(`'${JSON.stringify(files)}'`);

    expect(stderr).toBe('');
    const results = JSON.parse(stdout);
    expect(results).toHaveLength(3);

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);

    // Verify successful files were created
    const content1 = await fs.readFile(files[0]!.path, 'utf-8');
    expect(content1).toBe('Success 1');

    const content2 = await fs.readFile(files[2]!.path, 'utf-8');
    expect(content2).toBe('Success 2');
  });

  it('should error when no arguments provided', async () => {
    try {
      const { stdout, stderr } = await execAsync(`npx tsx ${scriptPath}`, {
        env: { ...process.env, npm_config_loglevel: 'error' },
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe(1);
      const errorOutput = JSON.parse(error.stdout || error.stderr);
      expect(errorOutput[0].success).toBe(false);
      expect(errorOutput[0].error).toBe('No arguments provided to script');
    }
  });

  it('should error with invalid JSON', async () => {
    try {
      const { stdout, stderr } = await execAsync(`npx tsx ${scriptPath} 'not valid json'`, {
        env: { ...process.env, npm_config_loglevel: 'error' },
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe(1);
      const errorOutput = JSON.parse(error.stdout || error.stderr);
      expect(errorOutput[0].success).toBe(false);
      expect(errorOutput[0].error).toContain('Failed to parse arguments');
    }
  });

  it('should error with invalid parameter structure', async () => {
    try {
      const invalidParams = [{ path: '/test/file.txt' }]; // missing content
      const { stdout, stderr } = await execAsync(
        `npx tsx ${scriptPath} '${JSON.stringify(invalidParams)}'`,
        { env: { ...process.env, npm_config_loglevel: 'error' } }
      );
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe(1);
      const errorOutput = JSON.parse(error.stdout || error.stderr);
      expect(errorOutput[0].success).toBe(false);
      expect(errorOutput[0].error).toContain('must have a content string');
    }
  });

  it('should create deeply nested directories', async () => {
    const deepPath = path.join(tempDir, 'a', 'b', 'c', 'd', 'e', 'file.txt');
    const fileParams = [{ path: deepPath, content: 'Deep content' }];

    const { stdout, stderr } = await runScript(`'${JSON.stringify(fileParams)}'`);

    expect(stderr).toBe('');
    const results = JSON.parse(stdout);
    expect(results[0].success).toBe(true);

    // Verify file and all directories were created
    const content = await fs.readFile(deepPath, 'utf-8');
    expect(content).toBe('Deep content');
  });
});
