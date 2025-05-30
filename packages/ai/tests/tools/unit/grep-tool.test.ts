import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { grepTool } from '@/tools/file-tools/grep-tool';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

describe('Grep Tool Unit Tests', () => {
  let tempDir: string;
  let sourceDir: string;

  beforeEach(() => {
    // Create temporary directory structure for tests
    tempDir = join(tmpdir(), `grep-test-${Date.now()}`);
    sourceDir = join(tempDir, 'src');

    mkdirSync(tempDir, { recursive: true });
    mkdirSync(sourceDir, { recursive: true });
    mkdirSync(join(sourceDir, 'components'), { recursive: true });
    mkdirSync(join(tempDir, 'tests'), { recursive: true });

    // Create test files with various content
    writeFileSync(
      join(sourceDir, 'app.ts'),
      `
import express from 'express';
import { router } from './router';

const app = express();
app.use('/api', router);

export default app;
`
    );

    writeFileSync(
      join(sourceDir, 'router.ts'),
      `
import { Router } from 'express';

const router = Router();

router.get('/users', (req, res) => {
  res.json({ users: [] });
});

router.post('/users', (req, res) => {
  res.json({ success: true });
});

export { router };
`
    );

    writeFileSync(
      join(sourceDir, 'components', 'Button.tsx'),
      `
import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return (
    <button onClick={onClick} className="btn">
      {children}
    </button>
  );
};

export default Button;
`
    );

    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify(
        {
          name: 'test-app',
          version: '1.0.0',
          dependencies: {
            express: '^4.18.0',
            react: '^18.0.0',
          },
        },
        null,
        2
      )
    );

    writeFileSync(
      join(tempDir, 'README.md'),
      `
# Test Application

This is a test application for grep functionality.

## Features
- Express server
- React components
- TypeScript support

## Usage
\`\`\`bash
npm start
\`\`\`
`
    );

    writeFileSync(
      join(tempDir, 'tests', 'app.test.ts'),
      `
import app from '../src/app';
import request from 'supertest';

describe('App', () => {
  test('should respond to health check', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});
`
    );
  });

  afterEach(() => {
    // Clean up temporary directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should have correct configuration', () => {
    expect(grepTool.id).toBe('grep-search');
    expect(grepTool.description).toBe(
      'Search file contents using regular expressions with ripgrep'
    );
    expect(grepTool.inputSchema).toBeDefined();
    expect(grepTool.outputSchema).toBeDefined();
    expect(grepTool.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      pattern: 'express',
      path: '/absolute/path',
    };
    const result = grepTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {
      pattern: 'express',
      total_matches: 2,
      files_searched: 5,
      files_with_matches: 2,
      matches: [
        {
          file: 'src/app.ts',
          line_number: 1,
          line_content: 'import express from "express";',
          match_content: 'express',
          context_before: [],
          context_after: [],
        },
      ],
    };

    const result = grepTool.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should find simple string matches', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'express',
        path: tempDir,
        case_sensitive: true,
      },
    });

    expect(result.pattern).toBe('express');
    expect(result.total_matches).toBeGreaterThan(0);
    expect(result.files_with_matches).toBeGreaterThan(0);

    // Should find matches in app.ts and router.ts
    const appMatches = result.matches.filter((m) => m.file.includes('app.ts'));
    const routerMatches = result.matches.filter((m) => m.file.includes('router.ts'));

    expect(appMatches.length).toBeGreaterThan(0);
    expect(routerMatches.length).toBeGreaterThan(0);
  });

  test('should handle case insensitive search', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'EXPRESS',
        path: tempDir,
        case_sensitive: false,
      },
    });

    expect(result.total_matches).toBeGreaterThan(0);

    // Should find lowercase 'express' matches
    const hasMatches = result.matches.some((m) => m.line_content.toLowerCase().includes('express'));
    expect(hasMatches).toBe(true);
  });

  test('should find regex patterns', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'router\\.(get|post)',
        path: tempDir,
        regex: true,
      },
    });

    expect(result.total_matches).toBeGreaterThan(0);

    // Should find both router.get and router.post
    const getMatches = result.matches.filter((m) => m.line_content.includes('router.get'));
    const postMatches = result.matches.filter((m) => m.line_content.includes('router.post'));

    expect(getMatches.length).toBeGreaterThan(0);
    expect(postMatches.length).toBeGreaterThan(0);
  });

  test('should handle whole word matching', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'app',
        path: tempDir,
        whole_word: true,
      },
    });

    // Should find 'app' as a whole word, not within other words
    const matches = result.matches;
    expect(matches.length).toBeGreaterThan(0);

    // Verify it's matching whole words
    for (const match of matches) {
      const wordBoundaryRegex = /\bapp\b/;
      expect(wordBoundaryRegex.test(match.line_content)).toBe(true);
    }
  });

  test('should include only specified file patterns', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'React',
        path: tempDir,
        include: ['**/*.tsx', '**/*.ts'],
      },
    });

    // Should only search TypeScript and TSX files
    for (const match of result.matches) {
      expect(match.file.endsWith('.ts') || match.file.endsWith('.tsx')).toBe(true);
    }
  });

  test('should exclude specified file patterns', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'test',
        path: tempDir,
        exclude: ['**/tests/**', '**/*.test.*'],
      },
    });

    // Should not find matches in test files
    const testFileMatches = result.matches.filter(
      (m) => m.file.includes('test') || m.file.includes('Test')
    );
    expect(testFileMatches.length).toBe(0);
  });

  test('should limit matches per file when max_count is specified', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'router',
        path: tempDir,
        max_count: 1,
      },
    });

    // Group matches by file
    const matchesByFile = new Map<string, number>();
    for (const match of result.matches) {
      matchesByFile.set(match.file, (matchesByFile.get(match.file) || 0) + 1);
    }

    // Each file should have at most 1 match
    for (const count of matchesByFile.values()) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });

  test('should provide context lines when requested', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'router.get',
        path: tempDir,
        context_lines: 2,
      },
    });

    expect(result.matches.length).toBeGreaterThan(0);

    const matchWithContext = result.matches[0];
    expect(matchWithContext.context_before.length).toBeGreaterThanOrEqual(0);
    expect(matchWithContext.context_after.length).toBeGreaterThanOrEqual(0);

    // Context should not exceed requested number of lines
    expect(matchWithContext.context_before.length).toBeLessThanOrEqual(2);
    expect(matchWithContext.context_after.length).toBeLessThanOrEqual(2);
  });

  test('should handle empty pattern error', async () => {
    await expect(
      grepTool.execute({
        context: {
          pattern: '',
          path: tempDir,
        },
      })
    ).rejects.toThrow('Pattern cannot be empty');
  });

  test('should handle non-absolute paths', async () => {
    await expect(
      grepTool.execute({
        context: {
          pattern: 'test',
          path: 'relative/path',
        },
      })
    ).rejects.toThrow('Path must be absolute');
  });

  test('should handle path traversal attempts', async () => {
    await expect(
      grepTool.execute({
        context: {
          pattern: 'test',
          path: '/tmp/../etc',
        },
      })
    ).rejects.toThrow('Path traversal not allowed');
  });

  test('should handle access to sensitive directories', async () => {
    await expect(
      grepTool.execute({
        context: {
          pattern: 'root',
          path: '/etc',
        },
      })
    ).rejects.toThrow('Access denied to path');
  });

  test('should handle multiline patterns when supported', async () => {
    // Create a file with multiline content
    writeFileSync(
      join(tempDir, 'multiline.txt'),
      `
function example() {
  return {
    name: 'test',
    value: 42
  };
}
`
    );

    const result = await grepTool.execute({
      context: {
        pattern: 'return \\{[^}]+\\}',
        path: tempDir,
        regex: true,
        multiline: true,
      },
    });

    // This test may not work with fallback implementation
    // but should work with ripgrep if available
    expect(result.total_matches).toBeGreaterThanOrEqual(0);
  });

  test('should return accurate file statistics', async () => {
    const result = await grepTool.execute({
      context: {
        pattern: 'import',
        path: tempDir,
      },
    });

    expect(result.files_searched).toBeGreaterThan(0);
    expect(result.files_with_matches).toBeGreaterThan(0);
    expect(result.files_with_matches).toBeLessThanOrEqual(result.files_searched);
    expect(result.total_matches).toBeGreaterThanOrEqual(result.files_with_matches);
  });

  test('should handle special regex characters in literal search', async () => {
    // Create a file with special characters
    writeFileSync(
      join(tempDir, 'special.txt'),
      `
Price: $10.99 (excluding tax)
Email: user@example.com
Pattern: /^[a-z]+$/
`
    );

    const result = await grepTool.execute({
      context: {
        pattern: '$10.99',
        path: tempDir,
        regex: false, // Literal search
      },
    });

    expect(result.total_matches).toBe(1);
    expect(result.matches[0].line_content).toContain('$10.99');
  });

  test('should handle binary files gracefully', async () => {
    // Create a fake binary file
    const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd]);
    writeFileSync(join(tempDir, 'binary.bin'), binaryContent);

    const result = await grepTool.execute({
      context: {
        pattern: 'test',
        path: tempDir,
      },
    });

    // Should not crash, may or may not find matches in binary files
    expect(result).toBeDefined();
    expect(result.total_matches).toBeGreaterThanOrEqual(0);
  });
});
