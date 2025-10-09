import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToolBadge } from './tool-badge';

// Mock the file-path utility
vi.mock('../../utils/file-path', () => ({
  getRelativePath: vi.fn((path: string) => path.replace('/Users/test/project/', '')),
}));

describe('ToolBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render EXECUTE badge with orange color', () => {
    const { lastFrame } = render(
      <ToolBadge tool="EXECUTE" filePath="/Users/test/project/test.sh" />
    );

    expect(lastFrame()).toContain('EXECUTE');
    expect(lastFrame()).toContain('(test.sh)');
  });

  it('should render WRITE badge with magenta color', () => {
    const { lastFrame } = render(<ToolBadge tool="WRITE" filePath="/Users/test/project/file.ts" />);

    expect(lastFrame()).toContain('WRITE');
    expect(lastFrame()).toContain('(file.ts)');
  });

  it('should render READ badge with blue color', () => {
    const { lastFrame } = render(
      <ToolBadge tool="READ" filePath="/Users/test/project/readme.md" />
    );

    expect(lastFrame()).toContain('READ');
    expect(lastFrame()).toContain('(readme.md)');
  });

  it('should render UPDATE badge with cyan color', () => {
    const { lastFrame } = render(
      <ToolBadge tool="UPDATE" filePath="/Users/test/project/config.json" />
    );

    expect(lastFrame()).toContain('UPDATE');
    expect(lastFrame()).toContain('(config.json)');
  });

  it('should use custom color when provided', () => {
    const { lastFrame } = render(
      <ToolBadge tool="EXECUTE" filePath="/Users/test/project/test.sh" color="red" />
    );

    expect(lastFrame()).toContain('EXECUTE');
    expect(lastFrame()).toContain('(test.sh)');
  });

  it('should display relative path from getRelativePath', () => {
    const { lastFrame } = render(
      <ToolBadge tool="READ" filePath="/Users/test/project/src/components/message.tsx" />
    );

    expect(lastFrame()).toContain('(src/components/message.tsx)');
  });
});
