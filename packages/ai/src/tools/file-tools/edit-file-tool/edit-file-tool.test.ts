import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { materialize } from '@buster/test-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanupTempDir, createTempDir, createTestFile } from '../test-utils';
import type { EditFileToolContext } from './edit-file-tool';
import { createEditFileTool } from './edit-file-tool';

describe.sequential('edit-file-tool tests', () => {
  let tempDir: string;
  let originalCwd: string;
  let tool: ReturnType<typeof createEditFileTool>;
  let context: EditFileToolContext;

  beforeAll(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temp directory
    tempDir = createTempDir('edit-file-test-');

    // Change to temp directory
    process.chdir(tempDir);

    context = {
      messageId: 'test-message-id',
      projectDirectory: tempDir,
      onToolEvent: vi.fn(),
    };

    tool = createEditFileTool(context);

    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore original working directory
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
    vi.restoreAllMocks();
  });

  describe('simple find and replace', () => {
    it('should perform simple string replacement', async () => {
      const filePath = join(tempDir, 'simple.ts');
      await createTestFile(
        filePath,
        `export const API_URL = 'https://old.com';
export const TIMEOUT = 5000;`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: 'https://old.com',
          newString: 'https://new.com',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.diff).toBeDefined();

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('https://new.com');
      expect(content).not.toContain('https://old.com');
    });

    it('should perform multiline replacement', async () => {
      const filePath = join(tempDir, 'multiline.ts');
      await createTestFile(
        filePath,
        `export function connect() {
  return db.connect();
}`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: `export function connect() {
  return db.connect();
}`,
          newString: `export async function connect() {
  return await db.connect();
}`,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('async function connect');
      expect(content).toContain('await db.connect');
    });
  });

  describe('replace all mode', () => {
    it('should replace all occurrences when replaceAll is true', async () => {
      const filePath = join(tempDir, 'replace-all.ts');
      await createTestFile(
        filePath,
        `const foo = 'test';
const bar = 'test';
const baz = 'test';`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: 'test',
          newString: 'prod',
          replaceAll: true,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect(content).not.toContain("'test'");
      expect((content.match(/'prod'/g) || []).length).toBe(3);
    });

    it('should fail when oldString appears multiple times without replaceAll', async () => {
      const filePath = join(tempDir, 'ambiguous.ts');
      await createTestFile(
        filePath,
        `const foo = 'value';
const bar = 'value';`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: 'value',
          newString: 'newValue',
          replaceAll: false,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('multiple times');
    });
  });

  describe('line trimmed replacement', () => {
    it('should match lines with different indentation', async () => {
      const filePath = join(tempDir, 'indented.ts');
      await createTestFile(
        filePath,
        `function foo() {
    const x = 1;
    return x;
}`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: `const x = 1;
return x;`,
          newString: `const x = 2;
return x * 2;`,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('const x = 2');
      expect(content).toContain('return x * 2');
    });
  });

  describe('whitespace normalized replacement', () => {
    it('should match with different whitespace', async () => {
      const filePath = join(tempDir, 'whitespace.ts');
      await createTestFile(filePath, `const   foo   =   1;`);

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: 'const foo = 1;',
          newString: 'const foo = 2;',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('2');
      expect(content).not.toContain('= 1');
    });
  });

  describe('error handling', () => {
    it('should return error when file not found', async () => {
      const rawResult = await tool.execute!(
        {
          filePath: join(tempDir, 'nonexistent.ts'),
          oldString: 'old',
          newString: 'new',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('not found');
    });

    it('should return error when oldString not found', async () => {
      const filePath = join(tempDir, 'no-match.ts');
      await createTestFile(filePath, 'const foo = 1;');

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: 'nonexistent',
          newString: 'new',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('not found');
    });

    it('should return error when oldString equals newString', async () => {
      const filePath = join(tempDir, 'same-strings.ts');
      await createTestFile(filePath, 'const foo = 1;');

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: 'foo',
          newString: 'foo',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('must be different');
    });

    it('should prevent path escape attempts', async () => {
      const rawResult = await tool.execute!(
        {
          filePath: '../../../etc/passwd',
          oldString: 'old',
          newString: 'new',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('not in the current working directory');
    });

    it('should return error when path is a directory', async () => {
      const dirPath = join(tempDir, 'test-dir');
      const dummyFile = join(dirPath, 'dummy.txt');
      mkdirSync(dirname(dummyFile), { recursive: true });
      writeFileSync(dummyFile, 'dummy', 'utf8');

      const rawResult = await tool.execute!(
        {
          filePath: dirPath,
          oldString: 'old',
          newString: 'new',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('directory');
    });
  });

  describe('diff generation', () => {
    it('should generate a diff showing changes', async () => {
      const filePath = join(tempDir, 'diff-test.ts');
      await createTestFile(
        filePath,
        `const API_URL = 'https://old.com';
const TIMEOUT = 5000;`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: 'https://old.com',
          newString: 'https://new.com',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);
      expect(result.diff).toBeDefined();
      expect(result.diff).toContain('-');
      expect(result.diff).toContain('+');
      expect(result.diff).toContain('old.com');
      expect(result.diff).toContain('new.com');
    });
  });

  describe('complex replacements', () => {
    it('should handle code block replacement', async () => {
      const filePath = join(tempDir, 'code-block.ts');
      await createTestFile(
        filePath,
        `export function fetchData() {
  const url = 'https://api.com';
  return fetch(url);
}`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: `const url = 'https://api.com';
  return fetch(url);`,
          newString: `const url = 'https://api.com';
  const options = { method: 'GET' };
  return fetch(url, options);`,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      expect(content).toContain('const options');
      expect(content).toContain('fetch(url, options)');
    });

    it('should preserve indentation in replacements', async () => {
      const filePath = join(tempDir, 'preserve-indent.ts');
      await createTestFile(
        filePath,
        `class Foo {
  method() {
    return 1;
  }
}`
      );

      const rawResult = await tool.execute!(
        {
          filePath,
          oldString: `method() {
    return 1;
  }`,
          newString: `method() {
    const value = 2;
    return value;
  }`,
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      // Check that indentation is preserved
      expect(lines.find((l) => l.includes('const value'))).toMatch(/^\s{4}const value/);
    });
  });

  describe('relative path handling', () => {
    it('should handle relative file paths', async () => {
      const relativePath = 'nested/relative.ts';
      const fullPath = join(tempDir, relativePath);
      await createTestFile(fullPath, 'const foo = 1;');

      const rawResult = await tool.execute!(
        {
          filePath: relativePath,
          oldString: 'foo = 1',
          newString: 'foo = 2',
        },
        {
          toolCallId: 'test-tool-call',
          messages: [],
          abortSignal: new AbortController().signal,
        }
      );
      const result = await materialize(rawResult);

      expect(result.success).toBe(true);

      const content = readFileSync(fullPath, 'utf8');
      expect(content).toContain('foo = 2');
    });
  });
});
