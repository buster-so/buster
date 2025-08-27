import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Sandbox } from '@daytonaio/sdk';
import { createSandbox } from '../../management/create-sandbox';
import { getSandboxFileTree } from './get-sandbox-file-tree';

describe('getSandboxFileTree', () => {
  let sandbox: Sandbox;

  beforeAll(async () => {
    // Create a sandbox for testing
    sandbox = await createSandbox();

    // Create test files and directories in /home/daytona/
    const testFiles = [
      'echo "test content" > /home/daytona/test-file.txt',
      'mkdir -p /home/daytona/test-dir/nested-dir',
      'echo "nested content" > /home/daytona/test-dir/nested-file.md',
      'echo "deeply nested" > /home/daytona/test-dir/nested-dir/deep-file.js',
      'echo "hidden file" > /home/daytona/.hidden-file',
      'mkdir -p /home/daytona/.hidden-dir',
      'echo "hidden nested" > /home/daytona/.hidden-dir/hidden-nested.txt'
    ];

    for (const command of testFiles) {
      await sandbox.process.executeCommand(command, '/home/daytona/');
    }
  }, 60000); // 60 second timeout for sandbox creation

  afterAll(async () => {
    if (sandbox) {
      await sandbox.delete();
    }
  });

  it('should return file tree including all created files and directories', async () => {
    const fileTree = await getSandboxFileTree(sandbox);

    // Verify the tree output contains our test files and directories
    expect(fileTree).toContain('test-file.txt');
    expect(fileTree).toContain('test-dir/');
    expect(fileTree).toContain('nested-file.md');
    expect(fileTree).toContain('nested-dir/');
    expect(fileTree).toContain('deep-file.js');
    
    // Verify hidden files and directories are included
    expect(fileTree).toContain('.hidden-file');
    expect(fileTree).toContain('.hidden-dir/');
    expect(fileTree).toContain('hidden-nested.txt');
    
    // Verify it's actually a tree structure with indentation
    expect(fileTree).toMatch(/├──|└──|│/); // Tree characters
  });

  it('should handle deep nesting properly', async () => {
    // Create a deeply nested structure
    const deepPath = '/home/daytona/deep1/deep2/deep3/deep4/deep5/deep6/deep7/deep8/deep9/deep10';
    await sandbox.process.executeCommand(`mkdir -p ${deepPath}`, '/home/daytona/');
    await sandbox.process.executeCommand(`echo "very deep" > ${deepPath}/deep-file.txt`, '/home/daytona/');

    const fileTree = await getSandboxFileTree(sandbox);

    // Verify the deeply nested file appears
    expect(fileTree).toContain('deep1/');
    expect(fileTree).toContain('deep10/');
    expect(fileTree).toContain('deep-file.txt');
  });
});