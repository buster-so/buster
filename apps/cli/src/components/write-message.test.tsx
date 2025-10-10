import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentMessage } from '../types/agent-messages';
import { WriteMessage } from './write-message';

// Mock hooks and utilities
vi.mock('../hooks/use-expansion', () => ({
  useExpansion: vi.fn(() => false),
  ExpansionContext: { Provider: ({ children }: any) => children },
}));

vi.mock('../utils/file-path', () => ({
  getRelativePath: vi.fn((path: string) => path.replace('/Users/test/project/', '')),
}));

describe('WriteMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render single file write successfully', () => {
    const message: Extract<AgentMessage, { kind: 'write' }> = {
      kind: 'write',
      event: 'complete',
      args: {
        files: [
          {
            path: '/Users/test/project/test.ts',
            content: 'const x = 1;\nconst y = 2;\nconst z = 3;',
          },
        ],
      },
      result: {
        results: [{ status: 'success', filePath: '/Users/test/project/test.ts' }],
      },
    };

    const { lastFrame } = render(<WriteMessage message={message} />);

    expect(lastFrame()).toContain('WRITE');
    expect(lastFrame()).toContain('(test.ts)');
    expect(lastFrame()).toContain('const x = 1;');
    expect(lastFrame()).toContain('Wrote 3 lines');
  });

  it('should render multiple files', () => {
    const message: Extract<AgentMessage, { kind: 'write' }> = {
      kind: 'write',
      event: 'complete',
      args: {
        files: [
          { path: '/Users/test/project/file1.ts', content: 'content1' },
          { path: '/Users/test/project/file2.ts', content: 'content2' },
        ],
      },
      result: {
        results: [
          { status: 'success', filePath: '/Users/test/project/file1.ts' },
          { status: 'success', filePath: '/Users/test/project/file2.ts' },
        ],
      },
    };

    const { lastFrame } = render(<WriteMessage message={message} />);

    expect(lastFrame()).toContain('file1.ts');
    expect(lastFrame()).toContain('file2.ts');
    expect(lastFrame()).toContain('content1');
    expect(lastFrame()).toContain('content2');
  });

  it('should show error status when write fails', () => {
    const message: Extract<AgentMessage, { kind: 'write' }> = {
      kind: 'write',
      event: 'complete',
      args: {
        files: [{ path: '/Users/test/project/test.ts', content: 'content' }],
      },
      result: {
        results: [
          {
            status: 'error',
            filePath: '/Users/test/project/test.ts',
            errorMessage: 'Permission denied',
          },
        ],
      },
    };

    const { lastFrame } = render(<WriteMessage message={message} />);

    expect(lastFrame()).toContain('Failed: Permission denied');
  });

  it('should preview first 5 lines by default', () => {
    const content = 'line1\nline2\nline3\nline4\nline5\nline6\nline7';
    const message: Extract<AgentMessage, { kind: 'write' }> = {
      kind: 'write',
      event: 'complete',
      args: {
        files: [{ path: '/Users/test/project/test.ts', content }],
      },
      result: {
        results: [{ status: 'success', filePath: '/Users/test/project/test.ts' }],
      },
    };

    const { lastFrame } = render(<WriteMessage message={message} />);

    expect(lastFrame()).toContain('line1');
    expect(lastFrame()).toContain('line5');
    // Expansion hint should show
    expect(lastFrame()).toContain('Press Ctrl+O to expand');
  });

  it('should handle message without result', () => {
    const message: Extract<AgentMessage, { kind: 'write' }> = {
      kind: 'write',
      event: 'start',
      args: {
        files: [{ path: '/Users/test/project/test.ts', content: 'content' }],
      },
    };

    const { lastFrame } = render(<WriteMessage message={message} />);

    expect(lastFrame()).toContain('WRITE');
    expect(lastFrame()).toContain('(test.ts)');
    expect(lastFrame()).toContain('content');
  });
});
