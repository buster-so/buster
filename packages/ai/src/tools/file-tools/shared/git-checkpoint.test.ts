import { describe, expect, it, vi } from 'vitest';
import { createGitCheckpoint, hasSuccessfulOperations } from './git-checkpoint';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { DocsAgentContextKeys } from '../../../../context/docs-agent-context';

// Mock runTypescript
vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

import { runTypescript } from '@buster/sandbox';

describe('git-checkpoint', () => {
  describe('hasSuccessfulOperations', () => {
    it('should return true if any operation has success status', () => {
      const results = [
        { status: 'error' },
        { status: 'success' },
        { status: 'error' },
      ];
      expect(hasSuccessfulOperations(results)).toBe(true);
    });

    it('should return false if no operation has success status', () => {
      const results = [
        { status: 'error' },
        { status: 'error' },
      ];
      expect(hasSuccessfulOperations(results)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasSuccessfulOperations([])).toBe(false);
    });
  });

  describe('createGitCheckpoint', () => {
    const mockRunTypescript = runTypescript as ReturnType<typeof vi.fn>;

    it('should return error when sandbox is not available', async () => {
      const runtimeContext = new RuntimeContext();
      
      const result = await createGitCheckpoint('test commit', runtimeContext);
      
      expect(result).toEqual({
        attempted: false,
        success: false,
        errorMessage: 'Git commit requires sandbox environment',
      });
    });

    it('should return error when not in git repository', async () => {
      const runtimeContext = new RuntimeContext();
      const mockSandbox = {};
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockRunTypescript.mockResolvedValueOnce({
        exitCode: 1,
        result: JSON.stringify({ success: false, error: 'not a git repo' }),
        stderr: '',
      });

      const result = await createGitCheckpoint('test commit', runtimeContext);
      
      expect(result).toEqual({
        attempted: false,
        success: false,
        errorMessage: 'Not in a git repository or git not available',
      });
    });

    it('should return error when no changes to commit', async () => {
      const runtimeContext = new RuntimeContext();
      const mockSandbox = {};
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockRunTypescript.mockResolvedValueOnce({
        exitCode: 0,
        result: JSON.stringify({ success: true, output: '' }),
        stderr: '',
      });

      const result = await createGitCheckpoint('test commit', runtimeContext);
      
      expect(result).toEqual({
        attempted: false,
        success: false,
        errorMessage: 'No changes detected to commit',
      });
    });

    it('should successfully create commit when changes exist', async () => {
      const runtimeContext = new RuntimeContext();
      const mockSandbox = {};
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      // Mock git status check
      mockRunTypescript.mockResolvedValueOnce({
        exitCode: 0,
        result: JSON.stringify({ success: true, output: 'M file.txt' }),
        stderr: '',
      });

      // Mock git add and commit
      mockRunTypescript.mockResolvedValueOnce({
        exitCode: 0,
        result: JSON.stringify({ success: true, commitHash: 'abc12345' }),
        stderr: '',
      });

      const result = await createGitCheckpoint('test commit', runtimeContext);
      
      expect(result).toEqual({
        attempted: true,
        success: true,
        commitHash: 'abc12345',
      });

      // Verify the commit message includes the description
      const commitCall = mockRunTypescript.mock.calls[1];
      expect(commitCall[1]).toContain('checkpoint: test commit');
      expect(commitCall[1]).toContain('🤖 Automated file operation checkpoint');
    });

    it('should handle commit failures gracefully', async () => {
      const runtimeContext = new RuntimeContext();
      const mockSandbox = {};
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      // Mock git status check
      mockRunTypescript.mockResolvedValueOnce({
        exitCode: 0,
        result: JSON.stringify({ success: true, output: 'M file.txt' }),
        stderr: '',
      });

      // Mock git commit failure
      mockRunTypescript.mockResolvedValueOnce({
        exitCode: 1,
        result: JSON.stringify({ success: false, error: 'commit failed' }),
        stderr: '',
      });

      const result = await createGitCheckpoint('test commit', runtimeContext);
      
      expect(result).toEqual({
        attempted: true,
        success: false,
        errorMessage: 'Failed to create commit: commit failed',
      });
    });
  });
});