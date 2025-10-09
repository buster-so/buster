import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentMessage } from '../types/agent-messages';
import { AgentMessageComponent } from './message';

// Mock all message components and hooks
vi.mock('../hooks/use-expansion', () => ({
  useExpansion: vi.fn(() => [false, vi.fn()]),
}));

vi.mock('../utils/file-path', () => ({
  getRelativePath: vi.fn((path: string) => path.replace('/Users/test/project/', '')),
}));

describe('AgentMessageComponent (Router)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user message', () => {
    const message: AgentMessage = {
      kind: 'user',
      content: 'Hello, this is a user message',
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('❯');
    expect(lastFrame()).toContain('Hello, this is a user message');
  });

  it('should render text-delta message', () => {
    const message: AgentMessage = {
      kind: 'text-delta',
      content: 'This is streaming text',
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('This is streaming text');
  });

  it('should render idle message with final response', () => {
    const message: AgentMessage = {
      kind: 'idle',
      args: { final_response: 'Task completed successfully' },
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('Task completed successfully');
  });

  it('should render idle message with default text when no final_response', () => {
    const message: AgentMessage = {
      kind: 'idle',
      args: {},
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('Task completed');
  });

  it('should route bash message to ExecuteMessage', () => {
    const message: AgentMessage = {
      kind: 'bash',
      event: 'complete',
      args: { command: 'ls -la', description: 'List files' },
      result: { stdout: 'file1.txt', stderr: '', exitCode: 0, success: true },
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('EXECUTE');
    expect(lastFrame()).toContain('(ls -la)');
  });

  it('should route grep message to ExecuteMessage', () => {
    const message: AgentMessage = {
      kind: 'grep',
      event: 'complete',
      args: { pattern: 'TODO', command: 'grep TODO' },
      result: {
        matches: [{ path: 'test.ts', lineNum: 1, lineText: '// TODO: fix' }],
        totalMatches: 1,
        truncated: false,
      },
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('EXECUTE');
    expect(lastFrame()).toContain('TODO');
  });

  it('should route ls message to ExecuteMessage', () => {
    const message: AgentMessage = {
      kind: 'ls',
      event: 'complete',
      args: { path: '/home', command: 'ls /home' },
      result: { output: 'file1.txt', count: 1, success: true, truncated: false },
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('EXECUTE');
  });

  it('should route write message to WriteMessage', () => {
    const message: AgentMessage = {
      kind: 'write',
      event: 'complete',
      args: {
        files: [{ path: '/Users/test/project/test.ts', content: 'const x = 1;' }],
      },
      result: {
        results: [{ status: 'success', filePath: '/Users/test/project/test.ts' }],
      },
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('WRITE');
    expect(lastFrame()).toContain('(test.ts)');
  });

  it('should route read message to ReadMessage', () => {
    const message: AgentMessage = {
      kind: 'read',
      event: 'complete',
      args: { filePath: '/Users/test/project/test.ts' },
      result: {
        status: 'success',
        file_path: '/Users/test/project/test.ts',
        content: 'const x = 1;',
        truncated: false,
      },
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('READ');
    expect(lastFrame()).toContain('(test.ts)');
  });

  it('should route edit message to EditMessage', () => {
    const message: AgentMessage = {
      kind: 'edit',
      event: 'complete',
      args: {
        filePath: '/Users/test/project/test.ts',
        oldString: 'old',
        newString: 'new',
      },
      result: {
        success: true,
        filePath: '/Users/test/project/test.ts',
        message: 'Updated',
      },
    };

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toContain('UPDATE');
  });

  it('should return null for unknown message types', () => {
    const message = {
      kind: 'unknown',
      data: 'something',
    } as any;

    const { lastFrame } = render(<AgentMessageComponent message={message} />);

    expect(lastFrame()).toBe('');
  });
});
