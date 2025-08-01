import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { grepSearch } from './grep-search-tool';

describe.sequential('grep-search-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sharedSandbox: any;

  beforeAll(async () => {
    if (hasApiKey) {
      sharedSandbox = await createSandbox({
        language: 'typescript',
      });
    }
  }, 120000);

  afterAll(async () => {
    if (sharedSandbox) {
      await sharedSandbox.delete();
    }
  }, 65000);

  function getTestDir() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  (hasApiKey ? it : it.skip)(
    'should execute ripgrep commands in sandbox environment',
    async () => {
      const testDir = getTestDir();

      // First, create test files with searchable content
      const createFilesCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('test1.txt', 'Hello world\\nThis is a test file\\nGoodbye world');
        fs.writeFileSync('test2.txt', 'Another test file\\nHello again\\nMore content here');
        fs.mkdirSync('subdir', { recursive: true });
        fs.writeFileSync('subdir/test3.txt', 'Nested file\\nHello from subdirectory\\nEnd of file');
        
        console.log('Files created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      // Test searching in a specific file with full path
      const result1 = await grepSearch.execute({
        context: {
          pattern: 'test',
          path: `${testDir}/test1.txt`,
        },
        runtimeContext,
      });

      expect(result1.title).toBe('test');
      expect(result1.metadata.matches).toBe(1);
      expect(result1.output).toContain(`${testDir}/test1.txt:`);
      expect(result1.output).toContain('Line 2: This is a test file');

      // Test searching all files in the test directory
      const result2 = await grepSearch.execute({
        context: {
          pattern: 'Hello',
          path: testDir,
        },
        runtimeContext,
      });

      expect(result2.title).toBe('Hello');
      expect(result2.metadata.matches).toBe(3);
      expect(result2.output).toContain(`${testDir}/test1.txt:`);
      expect(result2.output).toContain('Line 1: Hello world');
      expect(result2.output).toContain(`${testDir}/test2.txt:`);
      expect(result2.output).toContain('Line 2: Hello again');
      expect(result2.output).toContain(`${testDir}/subdir/test3.txt:`);
      expect(result2.output).toContain('Line 2: Hello from subdirectory');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle case-insensitive searches',
    async () => {
      const testDir = getTestDir();

      // Create a test file with mixed case content
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('case-test.txt', 'HELLO World\\nhello world\\nHeLLo WoRLd');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: 'hello',
          path: `${testDir}/case-test.txt`,
          flags: { caseInsensitive: true },
        },
        runtimeContext,
      });

      expect(result.title).toBe('hello');
      expect(result.metadata.matches).toBe(3);
      expect(result.output).toContain(`${testDir}/case-test.txt:`);
      expect(result.output).toContain('Line 1: HELLO World');
      expect(result.output).toContain('Line 2: hello world');
      expect(result.output).toContain('Line 3: HeLLo WoRLd');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle whole word matches',
    async () => {
      const testDir = getTestDir();

      // Create a test file
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('word-test.txt', 'test testing\\ntested tester\\ntest');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: 'test',
          path: `${testDir}/word-test.txt`,
          flags: { wholeWord: true },
        },
        runtimeContext,
      });

      expect(result.title).toBe('test');
      expect(result.metadata.matches).toBe(2);
      expect(result.output).toContain(`${testDir}/word-test.txt:`);
      expect(result.output).toContain('Line 1: test testing');
      expect(result.output).toContain('Line 3: test');
      expect(result.output).not.toContain('tester'); // Should not match partial words
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle fixed string searches (literal)',
    async () => {
      const testDir = getTestDir();

      // Create a test file with regex special characters
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('regex-test.txt', 'Price: $10.99\\nPattern: test.*\\nArray: [1,2,3]');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: '$10.99',
          path: `${testDir}/regex-test.txt`,
          flags: { fixedString: true },
        },
        runtimeContext,
      });

      expect(result.title).toBe('$10.99');
      expect(result.metadata.matches).toBe(1);
      expect(result.output).toContain(`${testDir}/regex-test.txt:`);
      expect(result.output).toContain('Line 1: Price: $10.99');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle inverted matches',
    async () => {
      const testDir = getTestDir();

      // Create a test file
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('invert-test.txt', 'line with test\\nline without\\nanother test line\\nno match here');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: 'test',
          path: `${testDir}/invert-test.txt`,
          flags: { invertMatch: true },
        },
        runtimeContext,
      });

      expect(result.title).toBe('test');
      expect(result.metadata.matches).toBe(2);
      expect(result.output).toContain(`${testDir}/invert-test.txt:`);
      expect(result.output).toContain('Line 2: line without');
      expect(result.output).toContain('Line 4: no match here');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle max count option',
    async () => {
      const testDir = getTestDir();

      // Create a test file with multiple matches
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('many-matches.txt', 'test 1\\ntest 2\\ntest 3\\ntest 4\\ntest 5');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: 'test',
          path: `${testDir}/many-matches.txt`,
          flags: { maxCount: 3 },
        },
        runtimeContext,
      });

      expect(result.title).toBe('test');
      expect(result.metadata.matches).toBe(3); // Should only return 3 matches
      const lines = result.output.split('\n').filter((line) => line.includes('Line '));
      expect(lines).toHaveLength(3);
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle no matches found',
    async () => {
      const testDir = getTestDir();

      // Create a test file with no matching content
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('no-match.txt', 'This file has no matches\\nNothing to find here');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: 'nonexistent',
          path: `${testDir}/no-match.txt`,
        },
        runtimeContext,
      });

      expect(result.title).toBe('nonexistent');
      expect(result.metadata.matches).toBe(0);
      expect(result.output).toBe('No matches found');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle glob patterns',
    async () => {
      const testDir = getTestDir();

      // Create test files
      const createFilesCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('file1.txt', 'First file with test');
        fs.writeFileSync('file2.txt', 'Second file with test');
        fs.writeFileSync('file.js', 'JavaScript file with test');
        console.log('Files created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      // Test with glob pattern
      const result = await grepSearch.execute({
        context: {
          pattern: 'test',
          path: testDir,
          include: '*.txt',
        },
        runtimeContext,
      });

      expect(result.title).toBe('test');
      expect(result.metadata.matches).toBe(2);
      expect(result.output).toContain(`${testDir}/file1.txt`);
      expect(result.output).toContain(`${testDir}/file2.txt`);
      expect(result.output).not.toContain('file.js'); // Should not match .js file
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle file not found error',
    async () => {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: 'test',
          path: '/nonexistent/path/file.txt',
        },
        runtimeContext,
      });

      // Should handle file not found gracefully
      expect(result.title).toBe('test');
      expect(result.metadata.matches).toBe(0);
      expect(result.output).toBe('No matches found');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle complex rg commands with multiple flags',
    async () => {
      const testDir = getTestDir();

      // Create test files
      const createFilesCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.mkdirSync('src', { recursive: true });
        fs.writeFileSync('src/main.ts', 'TODO: implement feature\\nconsole.log("test");');
        fs.writeFileSync('src/utils.ts', 'TODO: fix bug\\nexport function test() {}');
        fs.writeFileSync('src/readme.md', 'TODO: update docs');
        console.log('Files created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: 'TODO',
          path: `${testDir}/src/`,
          include: '*.ts',
        },
        runtimeContext,
      });

      expect(result.title).toBe('TODO');
      expect(result.metadata.matches).toBe(2);
      expect(result.output).toContain(`${testDir}/src/main.ts:`);
      expect(result.output).toContain('Line 1: TODO: implement feature');
      expect(result.output).toContain(`${testDir}/src/utils.ts:`);
      expect(result.output).toContain('Line 1: TODO: fix bug');
      expect(result.output).not.toContain('readme.md'); // Should not match .md files
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle JSON output from rg',
    async () => {
      const testDir = getTestDir();

      // Create a test file
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('json-test.txt', 'Line with test\\nAnother line');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          pattern: 'test',
          path: `${testDir}/json-test.txt`,
          flags: { json: true },
        },
        runtimeContext,
      });

      expect(result.title).toBe('test');
      // JSON output is returned as-is
      expect(result.output).toContain('{');
      expect(result.output).toContain('}');

      // Parse JSON output
      const jsonLines = result.output.trim().split('\n');
      expect(jsonLines.length).toBeGreaterThan(0);

      const firstLine = JSON.parse(jsonLines[0] || '{}');
      expect(firstLine.type).toBe('begin');

      // Find the match line
      const matchLine = jsonLines.find((line) => {
        const parsed = JSON.parse(line);
        return parsed.type === 'match';
      });
      expect(matchLine).toBeDefined();
    },
    65000
  );
});
