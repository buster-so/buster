import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentMessage } from '../../types/agent-messages';
import { EditMessage } from './edit-message';

// Mock hooks and utilities
vi.mock('../../hooks/use-expansion', () => ({
  useExpansion: vi.fn(() => [false, vi.fn()]),
}));

vi.mock('../../utils/file-path', () => ({
  getRelativePath: vi.fn((path: string) => path.replace('/Users/test/project/', '')),
}));

describe('EditMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render diff with additions and removals', () => {
    const diff = `--- test.ts
+++ test.ts
@@ -1,3 +1,3 @@
 const x = 1;
-const y = 2;
+const y = 3;
 const z = 4;`;

    const message: Extract<AgentMessage, { kind: 'edit' }> = {
      kind: 'edit',
      event: 'complete',
      args: {
        filePath: '/Users/test/project/test.ts',
        oldString: 'const y = 2;',
        newString: 'const y = 3;',
      },
      result: {
        success: true,
        filePath: '/Users/test/project/test.ts',
        diff,
      },
    };

    const { lastFrame } = render(<EditMessage message={message} />);

    expect(lastFrame()).toContain('UPDATE');
    expect(lastFrame()).toContain('(test.ts)');
    expect(lastFrame()).toContain('const y = 2;');
    expect(lastFrame()).toContain('const y = 3;');
    expect(lastFrame()).toContain('Updated with 1 addition and 1 removal');
  });

  it('should render diff with only additions', () => {
    const diff = `--- test.ts
+++ test.ts
@@ -1,2 +1,3 @@
 const x = 1;
+const y = 2;
 const z = 3;`;

    const message: Extract<AgentMessage, { kind: 'edit' }> = {
      kind: 'edit',
      event: 'complete',
      args: {
        filePath: '/Users/test/project/test.ts',
        oldString: 'const x = 1;\nconst z = 3;',
        newString: 'const x = 1;\nconst y = 2;\nconst z = 3;',
      },
      result: {
        success: true,
        filePath: '/Users/test/project/test.ts',
        diff,
      },
    };

    const { lastFrame } = render(<EditMessage message={message} />);

    expect(lastFrame()).toContain('const y = 2;');
    expect(lastFrame()).toContain('Updated with 1 addition and 0 removals');
  });

  it('should show line numbers in diff', () => {
    const diff = `--- test.ts
+++ test.ts
@@ -10,3 +10,3 @@
 const x = 1;
-const y = 2;
+const y = 3;
 const z = 4;`;

    const message: Extract<AgentMessage, { kind: 'edit' }> = {
      kind: 'edit',
      event: 'complete',
      args: {
        filePath: '/Users/test/project/test.ts',
        oldString: 'const y = 2;',
        newString: 'const y = 3;',
      },
      result: {
        success: true,
        filePath: '/Users/test/project/test.ts',
        diff,
      },
    };

    const { lastFrame } = render(<EditMessage message={message} />);

    // Should show line numbers 10, 11, 12
    expect(lastFrame()).toContain('10');
    expect(lastFrame()).toContain('11');
  });

  it('should handle edit without diff (success message only)', () => {
    const message: Extract<AgentMessage, { kind: 'edit' }> = {
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
        message: 'File updated successfully',
      },
    };

    const { lastFrame } = render(<EditMessage message={message} />);

    expect(lastFrame()).toContain('UPDATE');
    expect(lastFrame()).toContain('File updated successfully');
  });

  it('should handle edit failure', () => {
    const message: Extract<AgentMessage, { kind: 'edit' }> = {
      kind: 'edit',
      event: 'complete',
      args: {
        filePath: '/Users/test/project/test.ts',
        oldString: 'old',
        newString: 'new',
      },
      result: {
        success: false,
        filePath: '/Users/test/project/test.ts',
        errorMessage: 'String not found',
      },
    };

    const { lastFrame } = render(<EditMessage message={message} />);

    expect(lastFrame()).toContain('UPDATE');
    expect(lastFrame()).toContain('String not found');
  });

  it('should handle multi-edit with finalDiff', () => {
    const diff = `--- test.ts
+++ test.ts
@@ -1,3 +1,3 @@
 const x = 1;
-const y = 2;
+const y = 3;`;

    const message: Extract<AgentMessage, { kind: 'edit' }> = {
      kind: 'edit',
      event: 'complete',
      args: {
        filePath: '/Users/test/project/test.ts',
        edits: [{ oldString: 'const y = 2;', newString: 'const y = 3;' }],
      },
      result: {
        success: true,
        filePath: '/Users/test/project/test.ts',
        finalDiff: diff,
      },
    };

    const { lastFrame } = render(<EditMessage message={message} />);

    expect(lastFrame()).toContain('UPDATE');
    expect(lastFrame()).toContain('const y = 3;');
  });

  it('should handle message without result', () => {
    const message: Extract<AgentMessage, { kind: 'edit' }> = {
      kind: 'edit',
      event: 'start',
      args: {
        filePath: '/Users/test/project/test.ts',
        oldString: 'old',
        newString: 'new',
      },
    };

    const { lastFrame } = render(<EditMessage message={message} />);

    expect(lastFrame()).toBe('');
  });
});
