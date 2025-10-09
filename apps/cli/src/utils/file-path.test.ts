import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRelativePath } from './file-path';

describe('getRelativePath', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    // Reset to original cwd after each test
    vi.spyOn(process, 'cwd').mockReturnValue(originalCwd);
  });

  it('should return relative path from current working directory', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/Users/test/project');
    const absolutePath = '/Users/test/project/src/components/message.tsx';

    const result = getRelativePath(absolutePath);

    expect(result).toBe('src/components/message.tsx');
  });

  it('should return relative path for parent directory', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/Users/test/project/apps/cli');
    const absolutePath = '/Users/test/project/packages/ai/index.ts';

    const result = getRelativePath(absolutePath);

    expect(result).toBe('../../packages/ai/index.ts');
  });

  it('should return the same path if already in cwd', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/Users/test/project');
    const absolutePath = '/Users/test/project';

    const result = getRelativePath(absolutePath);

    expect(result).toBe('');
  });

  it('should handle paths outside of cwd', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/Users/test/project');
    const absolutePath = '/Users/other/file.ts';

    const result = getRelativePath(absolutePath);

    expect(result).toBe('../../other/file.ts');
  });

  it('should handle nested file paths', () => {
    vi.spyOn(process, 'cwd').mockReturnValue('/Users/test/project');
    const absolutePath = '/Users/test/project/apps/cli/src/components/shared/tool-badge.tsx';

    const result = getRelativePath(absolutePath);

    expect(result).toBe('apps/cli/src/components/shared/tool-badge.tsx');
  });
});
