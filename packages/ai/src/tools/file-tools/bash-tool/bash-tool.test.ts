import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { materialize } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createBashTool } from './bash-tool';

describe.sequential('bash-tool integration test', () => {
  let testDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create a temporary directory for tests
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bash-tool-test-'));

    // Change to temp directory
    process.chdir(testDir);
  });

  afterAll(async () => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up test directory
    if (testDir && fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should execute pwd command', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    const result = await materialize(
      await bashTool.execute!(
        {
          command: 'pwd',
          description: 'Print working directory',
        },
        { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
      )
    );

    expect(result).toMatchObject({
      command: 'pwd',
      success: true,
      exitCode: 0,
    });
    expect(result.stdout).toContain(testDir);
  });

  it('should execute echo command', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    const result = await materialize(
      await bashTool.execute!(
        {
          command: 'echo "Hello from bash"',
          description: 'Echo test',
        },
        { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
      )
    );

    expect(result).toMatchObject({
      command: 'echo "Hello from bash"',
      stdout: 'Hello from bash\n',
      success: true,
      exitCode: 0,
    });
  });

  it('should execute ls command', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    const result = await materialize(
      await bashTool.execute!(
        {
          command: 'ls -la',
          description: 'List files',
          timeout: 5000,
        },
        { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
      )
    );

    expect(result).toMatchObject({
      command: 'ls -la',
      success: true,
      exitCode: 0,
    });
    expect(result.stdout).toBeTruthy();
  });

  it('should handle command failure with nonexistent command', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    const rawResult = await bashTool.execute!(
      {
        command: 'nonexistentcommand',
        description: 'Should fail',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result).toMatchObject({
      command: 'nonexistentcommand',
      success: false,
    });
    expect(result.error).toBeTruthy();
  });

  it('should handle command failure with exit code', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    const rawResult = await bashTool.execute!(
      {
        command: 'exit 1',
        description: 'Exit with error code',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result).toMatchObject({
      command: 'exit 1',
      success: false,
    });
    expect(result.exitCode).toBeGreaterThan(0);
  });

  it('should create a file via echo redirect', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    const testFile = `test-bash-${Date.now()}.txt`;
    const rawResult = await bashTool.execute!(
      {
        command: `echo "test content" > ${testFile}`,
        description: 'Create file',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.success).toBe(true);

    // Verify file was created
    const filePath = path.join(testDir, testFile);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content.trim()).toBe('test content');

    // Clean up
    fs.unlinkSync(filePath);
  });

  it('should read a file with cat', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    // Create test file
    const testFile = `test-read-${Date.now()}.txt`;
    const filePath = path.join(testDir, testFile);
    fs.writeFileSync(filePath, 'file content');

    const rawResult = await bashTool.execute!(
      {
        command: `cat ${testFile}`,
        description: 'Read file',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result).toMatchObject({
      success: true,
      stdout: 'file content',
    });

    // Clean up
    fs.unlinkSync(filePath);
  });

  it('should fail when trying to read non-existent file', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    const rawResult = await bashTool.execute!(
      {
        command: 'cat nonexistent.txt',
        description: 'Try to read removed file',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.success).toBe(false);
  });

  it('should read first N lines of a file with head command', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    // Create test file with multiple lines
    const testFile = `test-head-${Date.now()}.sql`;
    const filePath = path.join(testDir, testFile);
    const lines = Array.from({ length: 100 }, (_, i) => `-- Line ${i + 1}: SQL statement`).join(
      '\n'
    );
    fs.writeFileSync(filePath, lines);

    const rawResult = await bashTool.execute!(
      {
        command: `head -50 ${testFile}`,
        description: 'Read first 50 lines',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result).toMatchObject({
      success: true,
      exitCode: 0,
    });

    // Verify we got exactly 50 lines
    const outputLines = result.stdout.trim().split('\n');
    expect(outputLines).toHaveLength(50);
    expect(outputLines[0]).toContain('Line 1');
    expect(outputLines[49]).toContain('Line 50');

    // Clean up
    fs.unlinkSync(filePath);
  });

  it('should handle head command with large SQL file paths', async () => {
    const bashTool = createBashTool({
      messageId: `test-message-${Date.now()}`,
      projectDirectory: testDir,
      isInResearchMode: false,
    });

    // Create a SQL file with realistic schema content
    const testFile = 'raw_schema.sql';
    const filePath = path.join(testDir, testFile);
    const schemaLines = [
      '-- Adventure Works Database Schema',
      'CREATE TABLE IF NOT EXISTS customers (',
      '  id SERIAL PRIMARY KEY,',
      '  name VARCHAR(255) NOT NULL,',
      '  email VARCHAR(255) UNIQUE',
      ');',
      '',
      'CREATE TABLE IF NOT EXISTS orders (',
      '  id SERIAL PRIMARY KEY,',
      '  customer_id INTEGER REFERENCES customers(id)',
      ');',
      ...Array.from({ length: 100 }, (_, i) => `-- Additional schema line ${i + 1}`),
    ].join('\n');
    fs.writeFileSync(filePath, schemaLines);

    const rawResult = await bashTool.execute!(
      {
        command: `head -50 ${testFile}`,
        description: 'Read schema file header',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result).toMatchObject({
      success: true,
      exitCode: 0,
    });
    expect(result.stdout).toContain('Adventure Works Database Schema');
    expect(result.stdout).toContain('CREATE TABLE');

    // Clean up
    fs.unlinkSync(filePath);
  });
});
