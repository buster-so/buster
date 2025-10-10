import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentMessage } from '../types/agent-messages';
import { ExecuteMessage } from './execute-message';

// Mock the useExpansion hook
vi.mock('../hooks/use-expansion', () => ({
  useExpansion: vi.fn(() => [false, vi.fn()]),
}));

describe('ExecuteMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bash messages', () => {
    it('should render bash command with stdout', () => {
      const message: Extract<AgentMessage, { kind: 'bash' }> = {
        kind: 'bash',
        event: 'complete',
        args: { command: 'ls -la', description: 'List files' },
        result: { stdout: 'file1.txt\nfile2.txt', stderr: '', exitCode: 0, success: true },
      };

      const { lastFrame } = render(<ExecuteMessage message={message} />);

      expect(lastFrame()).toContain('EXECUTE');
      expect(lastFrame()).toContain('(ls -la)');
      expect(lastFrame()).toContain('file1.txt');
      expect(lastFrame()).toContain('file2.txt');
      expect(lastFrame()).toContain('Exit code: 0');
    });

    it('should render bash command with stderr', () => {
      const message: Extract<AgentMessage, { kind: 'bash' }> = {
        kind: 'bash',
        event: 'complete',
        args: { command: 'invalid-command', description: 'Run invalid command' },
        result: { stdout: '', stderr: 'command not found', exitCode: 127, success: false },
      };

      const { lastFrame } = render(<ExecuteMessage message={message} />);

      expect(lastFrame()).toContain('command not found');
      expect(lastFrame()).toContain('Exit code: 127');
    });

    it('should use description when available', () => {
      const message: Extract<AgentMessage, { kind: 'bash' }> = {
        kind: 'bash',
        event: 'complete',
        args: { command: 'npm install', description: 'Install dependencies' },
        result: { stdout: 'installed successfully', stderr: '', exitCode: 0, success: true },
      };

      const { lastFrame } = render(<ExecuteMessage message={message} />);

      expect(lastFrame()).toContain('(npm install)');
    });
  });

  describe('grep messages', () => {
    it('should render grep search with matches', () => {
      const message: Extract<AgentMessage, { kind: 'grep' }> = {
        kind: 'grep',
        event: 'complete',
        args: { pattern: 'TODO', glob: '*.ts', command: 'grep TODO *.ts' },
        result: {
          matches: [
            { path: 'file1.ts', lineNum: 10, lineText: '// TODO: fix this' },
            { path: 'file2.ts', lineNum: 25, lineText: '// TODO: implement' },
          ],
          totalMatches: 2,
          truncated: false,
        },
      };

      const { lastFrame } = render(<ExecuteMessage message={message} />);

      expect(lastFrame()).toContain('EXECUTE');
      expect(lastFrame()).toContain('file1.ts:10: // TODO: fix this');
      expect(lastFrame()).toContain('file2.ts:25: // TODO: implement');
      expect(lastFrame()).toContain('Found 2 matches');
    });

    it('should show no matches found', () => {
      const message: Extract<AgentMessage, { kind: 'grep' }> = {
        kind: 'grep',
        event: 'complete',
        args: { pattern: 'FIXME', command: 'grep FIXME' },
        result: { matches: [], totalMatches: 0, truncated: false },
      };

      const { lastFrame } = render(<ExecuteMessage message={message} />);

      expect(lastFrame()).toContain('Found 0 matches');
    });
  });

  describe('ls messages', () => {
    it('should render directory listing', () => {
      const message: Extract<AgentMessage, { kind: 'ls' }> = {
        kind: 'ls',
        event: 'complete',
        args: { path: '/home/user', command: 'ls /home/user' },
        result: {
          output: 'file1.txt\nfile2.txt\ndir1/',
          count: 3,
          success: true,
          truncated: false,
        },
      };

      const { lastFrame } = render(<ExecuteMessage message={message} />);

      expect(lastFrame()).toContain('EXECUTE');
      expect(lastFrame()).toContain('file1.txt');
      expect(lastFrame()).toContain('dir1/');
      expect(lastFrame()).toContain('Listed 3 files');
    });

    it('should handle ls errors', () => {
      const message: Extract<AgentMessage, { kind: 'ls' }> = {
        kind: 'ls',
        event: 'complete',
        args: { path: '/invalid', command: 'ls /invalid' },
        result: {
          output: '',
          count: 0,
          success: false,
          truncated: false,
          errorMessage: 'Directory not found',
        },
      };

      const { lastFrame } = render(<ExecuteMessage message={message} />);

      expect(lastFrame()).toContain('Directory not found');
    });
  });

  it('should handle messages without results', () => {
    const message: Extract<AgentMessage, { kind: 'bash' }> = {
      kind: 'bash',
      event: 'start',
      args: { command: 'npm test', description: 'Run tests' },
    };

    const { lastFrame } = render(<ExecuteMessage message={message} />);

    expect(lastFrame()).toContain('EXECUTE');
    expect(lastFrame()).toContain('(npm test)');
  });
});
