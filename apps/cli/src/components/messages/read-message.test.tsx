import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentMessage } from '../../types/agent-messages';
import { ReadMessage } from './read-message';

// Mock hooks and utilities
vi.mock('../../hooks/use-expansion', () => ({
  useExpansion: vi.fn(() => false),
  ExpansionContext: { Provider: ({ children }: any) => children },
}));

vi.mock('../../utils/file-path', () => ({
  getRelativePath: vi.fn((path: string) => path.replace('/Users/test/project/', '')),
}));

describe('ReadMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render successful file read', () => {
    const message: Extract<AgentMessage, { kind: 'read' }> = {
      kind: 'read',
      event: 'complete',
      args: { filePath: '/Users/test/project/test.ts' },
      result: {
        status: 'success',
        file_path: '/Users/test/project/test.ts',
        content: 'const x = 1;\nconst y = 2;',
        truncated: false,
      },
    };

    const { lastFrame } = render(<ReadMessage message={message} />);

    expect(lastFrame()).toContain('READ');
    expect(lastFrame()).toContain('(test.ts)');
    expect(lastFrame()).toContain('const x = 1;');
    expect(lastFrame()).toContain('const y = 2;');
    expect(lastFrame()).toContain('Read 2 lines');
  });

  it('should show truncation message when file is truncated', () => {
    const message: Extract<AgentMessage, { kind: 'read' }> = {
      kind: 'read',
      event: 'complete',
      args: { filePath: '/Users/test/project/large.ts' },
      result: {
        status: 'success',
        file_path: '/Users/test/project/large.ts',
        content: 'line1\nline2\nline3',
        truncated: true,
      },
    };

    const { lastFrame } = render(<ReadMessage message={message} />);

    expect(lastFrame()).toContain('Read 3 lines (truncated at 1000 lines)');
  });

  it('should render error state', () => {
    const message: Extract<AgentMessage, { kind: 'read' }> = {
      kind: 'read',
      event: 'complete',
      args: { filePath: '/Users/test/project/missing.ts' },
      result: {
        status: 'error',
        file_path: '/Users/test/project/missing.ts',
        error_message: 'File not found',
      },
    };

    const { lastFrame } = render(<ReadMessage message={message} />);

    expect(lastFrame()).toContain('READ');
    expect(lastFrame()).toContain('Error: File not found');
  });

  it('should preview first 5 lines by default', () => {
    const content = 'line1\nline2\nline3\nline4\nline5\nline6\nline7';
    const message: Extract<AgentMessage, { kind: 'read' }> = {
      kind: 'read',
      event: 'complete',
      args: { filePath: '/Users/test/project/test.ts' },
      result: {
        status: 'success',
        file_path: '/Users/test/project/test.ts',
        content,
        truncated: false,
      },
    };

    const { lastFrame } = render(<ReadMessage message={message} />);

    expect(lastFrame()).toContain('line1');
    expect(lastFrame()).toContain('line5');
    // Expansion hint should show
    expect(lastFrame()).toContain('Press Ctrl+O to expand');
  });

  it('should handle empty file', () => {
    const message: Extract<AgentMessage, { kind: 'read' }> = {
      kind: 'read',
      event: 'complete',
      args: { filePath: '/Users/test/project/empty.ts' },
      result: {
        status: 'success',
        file_path: '/Users/test/project/empty.ts',
        content: '',
        truncated: false,
      },
    };

    const { lastFrame } = render(<ReadMessage message={message} />);

    expect(lastFrame()).toContain('READ');
    expect(lastFrame()).toContain('Read 1 lines');
  });

  it('should handle message without result', () => {
    const message: Extract<AgentMessage, { kind: 'read' }> = {
      kind: 'read',
      event: 'start',
      args: { filePath: '/Users/test/project/test.ts' },
    };

    const { lastFrame } = render(<ReadMessage message={message} />);

    expect(lastFrame()).toBe('');
  });
});
