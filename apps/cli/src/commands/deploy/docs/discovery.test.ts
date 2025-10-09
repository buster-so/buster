import { readFile } from 'node:fs/promises';
import { glob } from 'fast-glob';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverAndPrepareDocs, discoverDocFiles, prepareDocsForDeployment } from './discovery';

// Mock dependencies
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

vi.mock('fast-glob', () => ({
  glob: vi.fn(),
}));

const mockedReadFile = vi.mocked(readFile);
const mockedGlob = vi.mocked(glob);

describe('discoverDocFiles', () => {
  const baseDir = '/project';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should discover markdown files using include patterns', async () => {
    const includePatterns = ['docs/*.md', 'README.md'];
    const mockFiles = [
      '/project/docs/guide.md',
      '/project/docs/api.md',
      '/project/README.md',
      '/project/docs/config.json', // Should be filtered out
    ];

    mockedGlob.mockResolvedValue(mockFiles);

    const result = await discoverDocFiles(includePatterns, baseDir);

    expect(glob).toHaveBeenCalledWith(['/project/docs/*.md', '/project/README.md'], {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
      absolute: true,
      unique: true,
      cwd: baseDir,
    });

    expect(result).toEqual([
      '/project/README.md',
      '/project/docs/api.md',
      '/project/docs/guide.md',
    ]);
  });

  it('should handle absolute patterns', async () => {
    const includePatterns = ['/absolute/path/*.md'];
    mockedGlob.mockResolvedValue([]);

    await discoverDocFiles(includePatterns, baseDir);

    expect(glob).toHaveBeenCalledWith(['/absolute/path/*.md'], expect.any(Object));
  });

  it('should filter out non-markdown files', async () => {
    const includePatterns = ['docs/*'];
    const mockFiles = [
      '/project/docs/guide.md',
      '/project/docs/api.MD', // Should be included (case insensitive)
      '/project/docs/config.json',
      '/project/docs/script.js',
      '/project/docs/README.txt',
    ];

    mockedGlob.mockResolvedValue(mockFiles);

    const result = await discoverDocFiles(includePatterns, baseDir);

    expect(result).toEqual(['/project/docs/api.MD', '/project/docs/guide.md']);
  });

  it('should return sorted results', async () => {
    const includePatterns = ['*.md'];
    const mockFiles = ['/project/z.md', '/project/a.md', '/project/m.md'];

    mockedGlob.mockResolvedValue(mockFiles);

    const result = await discoverDocFiles(includePatterns, baseDir);

    expect(result).toEqual(['/project/a.md', '/project/m.md', '/project/z.md']);
  });

  it('should return empty array when no files found', async () => {
    const includePatterns = ['*.md'];
    mockedGlob.mockResolvedValue([]);

    const result = await discoverDocFiles(includePatterns, baseDir);

    expect(result).toEqual([]);
  });
});

describe('prepareDocsForDeployment', () => {
  const baseDir = '/project';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prepare regular markdown files', async () => {
    const files = ['/project/docs/guide.md', '/project/README.md'];

    mockedReadFile
      .mockResolvedValueOnce('# Guide\nThis is a guide')
      .mockResolvedValueOnce('# Project\nProject description');

    const result = await prepareDocsForDeployment(files, baseDir);

    expect(result).toEqual([
      {
        name: 'docs/guide.md',
        content: '# Guide\nThis is a guide',
        type: 'normal',
      },
      {
        name: 'README.md',
        content: '# Project\nProject description',
        type: 'normal',
      },
    ]);

    expect(readFile).toHaveBeenCalledTimes(2);
    expect(readFile).toHaveBeenCalledWith('/project/docs/guide.md', 'utf-8');
    expect(readFile).toHaveBeenCalledWith('/project/README.md', 'utf-8');
  });

  it('should identify ANALYST.md files as analyst type', async () => {
    const files = [
      '/project/ANALYST.md',
      '/project/docs/ANALYST.MD',
      '/project/subdir/analyst.md', // lowercase - should be analyst
    ];

    mockedReadFile
      .mockResolvedValueOnce('# Analyst Guide\nAnalyst instructions')
      .mockResolvedValueOnce('# Another Analyst\nMore instructions')
      .mockResolvedValueOnce('# Lowercase Analyst\nContent');

    const result = await prepareDocsForDeployment(files, baseDir);

    expect(result).toEqual([
      {
        name: 'ANALYST.md',
        content: '# Analyst Guide\nAnalyst instructions',
        type: 'analyst',
      },
      {
        name: 'docs/ANALYST.MD',
        content: '# Another Analyst\nMore instructions',
        type: 'analyst',
      },
      {
        name: 'subdir/analyst.md',
        content: '# Lowercase Analyst\nContent',
        type: 'analyst',
      },
    ]);
  });

  it('should handle file read errors gracefully', async () => {
    const files = ['/project/good.md', '/project/bad.md', '/project/another-good.md'];

    mockedReadFile
      .mockResolvedValueOnce('Good content')
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValueOnce('Another good content');

    // Mock console.warn to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await prepareDocsForDeployment(files, baseDir);

    expect(result).toEqual([
      {
        name: 'good.md',
        content: 'Good content',
        type: 'normal',
      },
      {
        name: 'another-good.md',
        content: 'Another good content',
        type: 'normal',
      },
    ]);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to read doc file /project/bad.md:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle empty file list', async () => {
    const result = await prepareDocsForDeployment([], baseDir);

    expect(result).toEqual([]);
    expect(readFile).not.toHaveBeenCalled();
  });

  it('should handle complex file paths correctly', async () => {
    const files = [
      '/project/docs/sub/folder/deep.md',
      '/project/docs/with spaces/file.md',
      '/project/docs/ANALYST.md',
    ];

    mockedReadFile
      .mockResolvedValueOnce('Deep content')
      .mockResolvedValueOnce('Spaced content')
      .mockResolvedValueOnce('Analyst content');

    const result = await prepareDocsForDeployment(files, baseDir);

    expect(result).toEqual([
      {
        name: 'docs/sub/folder/deep.md',
        content: 'Deep content',
        type: 'normal',
      },
      {
        name: 'docs/with spaces/file.md',
        content: 'Spaced content',
        type: 'normal',
      },
      {
        name: 'docs/ANALYST.md',
        content: 'Analyst content',
        type: 'analyst',
      },
    ]);
  });
});

describe('discoverAndPrepareDocs', () => {
  const baseDir = '/project';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should combine discovery and preparation', async () => {
    const includePatterns = ['docs/*.md'];
    // Files are returned in alphabetical order by the discovery function
    const mockFiles = ['/project/docs/ANALYST.md', '/project/docs/guide.md'];

    mockedGlob.mockResolvedValue(mockFiles);
    mockedReadFile
      .mockResolvedValueOnce('# Analyst\nAnalyst instructions')
      .mockResolvedValueOnce('# Guide\nGuide content');

    const result = await discoverAndPrepareDocs(includePatterns, baseDir);

    expect(result).toEqual({
      docs: [
        {
          name: 'docs/ANALYST.md',
          content: '# Analyst\nAnalyst instructions',
          type: 'analyst',
        },
        {
          name: 'docs/guide.md',
          content: '# Guide\nGuide content',
          type: 'normal',
        },
      ],
      fileCount: 2,
    });
  });

  it('should handle case where discovery finds files but preparation fails for some', async () => {
    const includePatterns = ['*.md'];
    // Files are returned in alphabetical order
    const mockFiles = ['/project/bad.md', '/project/good.md'];

    mockedGlob.mockResolvedValue(mockFiles);
    mockedReadFile
      .mockRejectedValueOnce(new Error('File not found'))
      .mockResolvedValueOnce('Good content');

    // Mock console.warn to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await discoverAndPrepareDocs(includePatterns, baseDir);

    expect(result).toEqual({
      docs: [
        {
          name: 'good.md',
          content: 'Good content',
          type: 'normal',
        },
      ],
      fileCount: 2, // Original file count from discovery
    });

    consoleSpy.mockRestore();
  });

  it('should handle empty discovery results', async () => {
    const includePatterns = ['*.md'];

    mockedGlob.mockResolvedValue([]);

    const result = await discoverAndPrepareDocs(includePatterns, baseDir);

    expect(result).toEqual({
      docs: [],
      fileCount: 0,
    });

    expect(readFile).not.toHaveBeenCalled();
  });
});
