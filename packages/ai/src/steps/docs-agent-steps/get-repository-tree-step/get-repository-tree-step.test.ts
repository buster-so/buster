import type { Sandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runGetRepositoryTreeStep } from './get-repository-tree-step';
import { getRepositoryTree } from './helpers/tree-helper';

// Mock the tree helper
vi.mock('./helpers/tree-helper', () => ({
  getRepositoryTree: vi.fn(),
}));

describe('runGetRepositoryTreeStep', () => {
  let mockSandbox: Sandbox;
  const validDataSourceId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a mock sandbox
    mockSandbox = {
      id: 'mock-sandbox-123',
      url: 'https://sandbox.example.com',
      fs: {
        uploadFile: vi.fn(),
        readFile: vi.fn(),
      },
      process: {
        executeCommand: vi.fn(),
      },
    } as unknown as Sandbox;
  });

  it('should generate repository tree successfully', async () => {
    // Mock the pwd command - note that result should include newline
    vi.mocked(mockSandbox.process.executeCommand).mockResolvedValueOnce({
      result: '/home/workspace\n',
      exitCode: 0,
    });

    // Mock the tree helper to return a successful result
    const mockTreeOutput = `.
├── src/
│   └── index.ts
└── package.json`;

    vi.mocked(getRepositoryTree).mockResolvedValueOnce({
      success: true,
      output: mockTreeOutput,
      command: 'tree --gitignore "."',
    });

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        dataSourceId: validDataSourceId,
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toContain('<YOU ARE HERE: /home/workspace>');
    expect(result.repositoryTree).toContain(mockTreeOutput);
    expect(result.message).toBe('Test message');
    expect(result.organizationId).toBe('org-123');
    expect(result.context).toEqual(input.context);
  });

  it('should handle missing sandbox gracefully', async () => {
    // Create a minimal sandbox object that passes validation but doesn't have full functionality
    const minimalSandbox = {
      id: 'mock-sandbox-minimal',
      fs: {},
    } as unknown as Sandbox;

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: minimalSandbox,
        dataSourceId: validDataSourceId,
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toBe('');
    expect(result.message).toBe('Test message');
  });

  it('should handle tree generation failure gracefully', async () => {
    // Mock the pwd command
    vi.mocked(mockSandbox.process.executeCommand).mockResolvedValueOnce({
      result: '/home/workspace\n',
      exitCode: 0,
    });

    // Mock the tree helper to return a failure
    vi.mocked(getRepositoryTree).mockResolvedValueOnce({
      success: false,
      error: 'tree command not found',
    });

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        dataSourceId: validDataSourceId,
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toBe('');
    expect(result.message).toBe('Test message');
  });

  it('should handle pwd command failure gracefully', async () => {
    // Mock the pwd command to fail
    vi.mocked(mockSandbox.process.executeCommand).mockRejectedValueOnce(
      new Error('Command failed')
    );

    // Mock the tree helper to return a successful result
    const mockTreeOutput = `.
├── src/
│   └── index.ts
└── package.json`;

    vi.mocked(getRepositoryTree).mockResolvedValueOnce({
      success: true,
      output: mockTreeOutput,
      command: 'tree --gitignore "."',
    });

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        dataSourceId: validDataSourceId,
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toContain('<YOU ARE HERE: ');
    expect(result.repositoryTree).toContain(mockTreeOutput);
  });

  it('should handle complete tree generation error gracefully', async () => {
    // Mock the pwd command
    vi.mocked(mockSandbox.process.executeCommand).mockResolvedValueOnce({
      result: '/home/workspace\n',
      exitCode: 0,
    });

    // Mock the tree helper to throw an error
    vi.mocked(getRepositoryTree).mockRejectedValueOnce(new Error('Unexpected error'));

    const input = {
      message: 'Test message',
      organizationId: 'org-123',
      contextInitialized: true,
      context: {
        sandbox: mockSandbox,
        dataSourceId: validDataSourceId,
        todoList: '',
        clarificationQuestions: [],
      },
    };

    const result = await runGetRepositoryTreeStep(input);

    expect(result).toBeDefined();
    expect(result.repositoryTree).toBe('');
    expect(result.message).toBe('Test message');
  });
});
