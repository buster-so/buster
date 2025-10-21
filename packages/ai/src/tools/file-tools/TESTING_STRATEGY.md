# File-Tools Testing Strategy

## Current State

### Test Coverage Matrix

| Tool | Unit Tests | Integration Tests | Status |
|------|-----------|------------------|--------|
| bash-tool | ✅ Complete | ✅ Complete | **DONE** |
| glob-tool | ✅ Complete | ❌ Missing | **PARTIAL** |
| grep-tool | ✅ Complete | ❌ Missing | **PARTIAL** |
| read-file-tool | ✅ Complete | ❌ Missing | **PARTIAL** |
| write-file-tool | ✅ Complete | ❌ Missing | **PARTIAL** |
| edit-file-tool | ❌ Missing | ❌ Missing | **NO TESTS** |
| multi-edit-file-tool | ❌ Missing | ❌ Missing | **NO TESTS** |
| ls-tool | ❌ Missing | ❌ Missing | **NO TESTS** |

### Test Metrics
- **Total Modules**: 8
- **With Unit Tests**: 5 (62.5%)
- **With Integration Tests**: 1 (12.5%)
- **Complete Coverage**: 1 (12.5%)

## Testing Philosophy

### Unit Tests (Mocked)
**Purpose**: Test business logic, validation, and error handling without filesystem I/O

**Pattern**:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('tool-name', () => {
  beforeEach(() => {
    // Mock Bun globals
    globalThis.Bun = {
      file: vi.fn(),
      spawn: vi.fn(),
      which: vi.fn()
    } as any;

    // Spy on console
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should validate inputs correctly', async () => {
    // Test input validation
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });
});
```

### Integration Tests (Real Filesystem)
**Purpose**: Verify end-to-end functionality with actual filesystem operations in /tmp

**Pattern**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe.sequential('tool-name.int.test.ts', () => {
  let tempDir: string;

  beforeAll(() => {
    // Create isolated temp directory
    tempDir = mkdtempSync(join(tmpdir(), 'tool-test-'));
  });

  afterAll(() => {
    // Clean up temp directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should perform real filesystem operations', async () => {
    // Test with actual files
  });
});
```

## Testing Strategy by Tool

### 1. bash-tool ✅ COMPLETE
**Status**: Fully tested with both unit and integration tests

**Coverage**:
- ✅ Command execution with stdout/stderr
- ✅ Exit code handling
- ✅ Timeout support
- ✅ dbt command validation
- ✅ Research mode restrictions
- ✅ Output truncation
- ✅ Cross-platform shell detection

**No Action Needed**

---

### 2. glob-tool

#### Current: Unit Tests Only
- ✅ Pattern matching (`**/*.ts`, `*.{js,ts}`)
- ✅ Pagination (limit/offset)
- ✅ Sorting by modification time
- ✅ Error handling

#### Missing: Integration Tests
**File**: `glob-tool/glob-tool.int.test.ts`

**Test Scenarios**:
```typescript
describe.sequential('glob-tool integration tests', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'glob-test-'));

    // Create test file structure
    await createTestStructure({
      'src/index.ts': 'export const foo = 1;',
      'src/utils/helpers.ts': 'export const bar = 2;',
      'src/utils/types.ts': 'export type Baz = string;',
      'tests/unit/test1.test.ts': 'test 1',
      'tests/integration/test2.int.test.ts': 'test 2',
      'docs/README.md': '# Docs',
      'package.json': '{}',
      '.gitignore': 'node_modules'
    });
  });

  it('should find TypeScript files with **/*.ts pattern', async () => {
    // Should find all .ts files recursively
  });

  it('should respect directory boundaries', async () => {
    // Pattern: src/**/*.ts should only find files in src/
  });

  it('should handle alternation patterns', async () => {
    // Pattern: *.{ts,js} should find both
  });

  it('should paginate large result sets', async () => {
    // Create 100 files, paginate with limit=10
  });

  it('should sort by modification time', async () => {
    // Create files with different mtimes, verify sorting
  });

  it('should handle non-existent directories', async () => {
    // Pattern in non-existent path should return empty
  });
});
```

---

### 3. grep-tool

#### Current: Unit Tests Only
- ✅ Pattern matching
- ✅ Output modes (content, files_with_matches, count)
- ✅ Context lines (-A, -B, -C)
- ✅ Case sensitivity
- ✅ Glob filtering

#### Missing: Integration Tests
**File**: `grep-tool/grep-tool.int.test.ts`

**Test Scenarios**:
```typescript
describe.sequential('grep-tool integration tests', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'grep-test-'));

    // Create test files with searchable content
    await createTestFiles({
      'config.ts': `
        export const API_KEY = 'secret123';
        export const API_URL = 'https://api.example.com';
        export const TIMEOUT = 5000;
      `,
      'database.ts': `
        import { config } from './config';
        export function connect() {
          return db.connect(config.API_URL);
        }
      `,
      'utils.ts': `
        export function formatDate(date: Date) {
          return date.toISOString();
        }
      `
    });
  });

  it('should search for literal strings', async () => {
    // Search for "API_KEY" should find config.ts
  });

  it('should support regex patterns', async () => {
    // Search for "export (const|function)" should find matches
  });

  it('should filter by file glob', async () => {
    // Search with glob="*.ts" should only search .ts files
  });

  it('should return context lines with -A, -B, -C', async () => {
    // Search with context should include surrounding lines
  });

  it('should handle case-insensitive search', async () => {
    // Search for "api_key" with -i should find "API_KEY"
  });

  it('should return different output modes', async () => {
    // Test content vs files_with_matches vs count modes
  });

  it('should handle multiline patterns', async () => {
    // Test patterns that span multiple lines
  });
});
```

---

### 4. read-file-tool

#### Current: Unit Tests Only
- ✅ Single file reading
- ✅ Path validation (security)
- ✅ Line truncation (1000 lines)
- ✅ Character truncation
- ✅ Error handling

#### Missing: Integration Tests
**File**: `read-file-tool/read-file-tool.int.test.ts`

**Test Scenarios**:
```typescript
describe.sequential('read-file-tool integration tests', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'read-test-'));
  });

  it('should read small text file', async () => {
    const filePath = join(tempDir, 'small.txt');
    await Bun.write(filePath, 'Hello World\nLine 2\nLine 3');

    const result = await tool.execute({ filePath });

    expect(result.files[0].content).toContain('Hello World');
    expect(result.files[0].lineCount).toBe(3);
  });

  it('should truncate files exceeding 1000 lines', async () => {
    const filePath = join(tempDir, 'large.txt');
    const lines = Array.from({ length: 1500 }, (_, i) => `Line ${i + 1}`);
    await Bun.write(filePath, lines.join('\n'));

    const result = await tool.execute({ filePath });

    expect(result.files[0].lineCount).toBe(1000);
    expect(result.files[0].wasTruncated).toBe(true);
  });

  it('should truncate long lines', async () => {
    const filePath = join(tempDir, 'long-line.txt');
    const longLine = 'x'.repeat(3000);
    await Bun.write(filePath, longLine);

    const result = await tool.execute({ filePath });

    expect(result.files[0].content.length).toBeLessThan(2500);
  });

  it('should handle non-existent files', async () => {
    const result = await tool.execute({
      filePath: join(tempDir, 'does-not-exist.txt')
    });

    expect(result.files[0].success).toBe(false);
    expect(result.files[0].error).toContain('not found');
  });

  it('should prevent path escape attempts', async () => {
    const result = await tool.execute({
      filePath: '../../../etc/passwd'
    });

    expect(result.files[0].success).toBe(false);
    expect(result.files[0].error).toContain('outside project');
  });
});
```

---

### 5. write-file-tool

#### Current: Unit Tests Only
- ✅ File creation
- ✅ File overwriting
- ✅ Batch operations
- ✅ Path validation (security)
- ✅ Error handling

#### Missing: Integration Tests
**File**: `write-file-tool/write-file-tool.int.test.ts`

**Test Scenarios**:
```typescript
describe.sequential('write-file-tool integration tests', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'write-test-'));
  });

  it('should create new file', async () => {
    const filePath = join(tempDir, 'new-file.txt');

    const result = await tool.execute({
      files: [{ filePath, content: 'Hello World' }]
    });

    expect(result.results[0].success).toBe(true);

    // Verify file exists
    const fileContent = await Bun.file(filePath).text();
    expect(fileContent).toBe('Hello World');
  });

  it('should overwrite existing file', async () => {
    const filePath = join(tempDir, 'existing.txt');
    await Bun.write(filePath, 'Original Content');

    const result = await tool.execute({
      files: [{ filePath, content: 'New Content' }]
    });

    expect(result.results[0].success).toBe(true);

    const fileContent = await Bun.file(filePath).text();
    expect(fileContent).toBe('New Content');
  });

  it('should write multiple files in batch', async () => {
    const files = [
      { filePath: join(tempDir, 'file1.txt'), content: 'Content 1' },
      { filePath: join(tempDir, 'file2.txt'), content: 'Content 2' },
      { filePath: join(tempDir, 'file3.txt'), content: 'Content 3' }
    ];

    const result = await tool.execute({ files });

    expect(result.results.every(r => r.success)).toBe(true);

    // Verify all files exist
    for (const file of files) {
      const content = await Bun.file(file.filePath).text();
      expect(content).toBe(file.content);
    }
  });

  it('should create nested directories', async () => {
    const filePath = join(tempDir, 'nested/deep/file.txt');

    const result = await tool.execute({
      files: [{ filePath, content: 'Nested Content' }]
    });

    expect(result.results[0].success).toBe(true);

    const content = await Bun.file(filePath).text();
    expect(content).toBe('Nested Content');
  });

  it('should prevent path escape attempts', async () => {
    const result = await tool.execute({
      files: [{ filePath: '../../../tmp/malicious.txt', content: 'Bad' }]
    });

    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toContain('outside project');
  });
});
```

---

### 6. edit-file-tool ❌ NO TESTS

#### Missing: All Tests
**Files**:
- `edit-file-tool/edit-file-tool.test.ts` (unit)
- `edit-file-tool/edit-file-tool.int.test.ts` (integration)

**Unit Test Scenarios**:
```typescript
describe('edit-file-tool unit tests', () => {
  it('should validate find-and-replace parameters', async () => {
    // Test input validation
  });

  it('should handle file not found', async () => {
    // Mock file not existing
  });

  it('should handle pattern not found', async () => {
    // Mock pattern not matching
  });

  it('should prevent path escape', async () => {
    // Test security validation
  });

  it('should generate diff output', async () => {
    // Test diff generation
  });
});
```

**Integration Test Scenarios**:
```typescript
describe.sequential('edit-file-tool integration tests', () => {
  let tempDir: string;

  it('should perform simple find-and-replace', async () => {
    const filePath = join(tempDir, 'code.ts');
    await Bun.write(filePath, `
      export const API_URL = 'https://old.com';
      export const TIMEOUT = 5000;
    `);

    const result = await tool.execute({
      filePath,
      oldString: 'https://old.com',
      newString: 'https://new.com'
    });

    expect(result.success).toBe(true);

    const content = await Bun.file(filePath).text();
    expect(content).toContain('https://new.com');
    expect(content).not.toContain('https://old.com');
  });

  it('should handle multiline replacements', async () => {
    // Test replacing multi-line code blocks
  });

  it('should preserve whitespace and formatting', async () => {
    // Test indentation preservation
  });

  it('should fail on ambiguous matches', async () => {
    // Pattern appears multiple times, should fail
  });

  it('should support replace_all mode', async () => {
    // Replace all occurrences
  });
});
```

---

### 7. multi-edit-file-tool ❌ NO TESTS

#### Missing: All Tests
**Files**:
- `multi-edit-file-tool/multi-edit-file-tool.test.ts` (unit)
- `multi-edit-file-tool/multi-edit-file-tool.int.test.ts` (integration)

**Unit Test Scenarios**:
```typescript
describe('multi-edit-file-tool unit tests', () => {
  it('should validate edit operations', async () => {
    // Test operation validation
  });

  it('should handle operation failures', async () => {
    // Mock partial failure scenarios
  });

  it('should validate file paths', async () => {
    // Test security validation
  });
});
```

**Integration Test Scenarios**:
```typescript
describe.sequential('multi-edit-file-tool integration tests', () => {
  let tempDir: string;

  it('should perform sequential edits', async () => {
    const filePath = join(tempDir, 'config.ts');
    await Bun.write(filePath, `
      export const API_URL = 'https://old.com';
      export const TIMEOUT = 5000;
      export const RETRIES = 3;
    `);

    const result = await tool.execute({
      filePath,
      operations: [
        { oldString: 'https://old.com', newString: 'https://new.com' },
        { oldString: 'TIMEOUT = 5000', newString: 'TIMEOUT = 10000' },
        { oldString: 'RETRIES = 3', newString: 'RETRIES = 5' }
      ]
    });

    expect(result.success).toBe(true);
    expect(result.appliedOperations).toBe(3);

    const content = await Bun.file(filePath).text();
    expect(content).toContain('https://new.com');
    expect(content).toContain('TIMEOUT = 10000');
    expect(content).toContain('RETRIES = 5');
  });

  it('should stop on first failure', async () => {
    // If operation 2 fails, operations 3+ should not run
  });

  it('should provide detailed diff for all changes', async () => {
    // Aggregate diff showing all edits
  });
});
```

---

### 8. ls-tool ❌ NO TESTS

#### Missing: All Tests
**Files**:
- `ls-tool/ls-tool.test.ts` (unit)
- `ls-tool/ls-tool.int.test.ts` (integration)

**Unit Test Scenarios**:
```typescript
describe('ls-tool unit tests', () => {
  it('should validate directory paths', async () => {
    // Test input validation
  });

  it('should handle directory not found', async () => {
    // Mock non-existent directory
  });

  it('should prevent path escape', async () => {
    // Test security validation
  });

  it('should format tree output correctly', async () => {
    // Test tree formatting logic
  });
});
```

**Integration Test Scenarios**:
```typescript
describe.sequential('ls-tool integration tests', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ls-test-'));

    // Create directory structure
    await createTestStructure({
      'src/index.ts': '',
      'src/utils/helpers.ts': '',
      'src/utils/types.ts': '',
      'tests/unit/test1.test.ts': '',
      'docs/README.md': '',
      'package.json': '',
      '.gitignore': ''
    });
  });

  it('should list directory contents', async () => {
    const result = await tool.execute({
      directoryPath: tempDir
    });

    expect(result.entries).toContainEqual(
      expect.objectContaining({ name: 'src', type: 'directory' })
    );
    expect(result.entries).toContainEqual(
      expect.objectContaining({ name: 'package.json', type: 'file' })
    );
  });

  it('should show tree structure with depth', async () => {
    const result = await tool.execute({
      directoryPath: tempDir,
      tree: true,
      maxDepth: 2
    });

    expect(result.tree).toContain('src/');
    expect(result.tree).toContain('├── index.ts');
    expect(result.tree).toContain('└── utils/');
  });

  it('should include hidden files when requested', async () => {
    const result = await tool.execute({
      directoryPath: tempDir,
      includeHidden: true
    });

    expect(result.entries).toContainEqual(
      expect.objectContaining({ name: '.gitignore' })
    );
  });

  it('should exclude hidden files by default', async () => {
    const result = await tool.execute({
      directoryPath: tempDir
    });

    expect(result.entries).not.toContainEqual(
      expect.objectContaining({ name: '.gitignore' })
    );
  });
});
```

---

## Implementation Checklist

### Phase 1: Integration Tests for Existing Tools (High Priority)
- [ ] glob-tool integration tests
- [ ] grep-tool integration tests
- [ ] read-file-tool integration tests
- [ ] write-file-tool integration tests

### Phase 2: Tests for Untested Tools (Critical)
- [ ] edit-file-tool unit tests
- [ ] edit-file-tool integration tests
- [ ] multi-edit-file-tool unit tests
- [ ] multi-edit-file-tool integration tests
- [ ] ls-tool unit tests
- [ ] ls-tool integration tests

### Phase 3: Cross-Platform Validation
- [ ] Run all integration tests on macOS
- [ ] Run all integration tests on Linux
- [ ] Run all integration tests on Windows
- [ ] Fix platform-specific issues

### Phase 4: CI/CD Integration
- [ ] Add integration tests to CI pipeline
- [ ] Set up test coverage reporting
- [ ] Add performance benchmarks
- [ ] Document testing commands

## Testing Utilities

### Shared Test Helpers
**File**: `file-tools/test-utils.ts`

```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export interface TestFileStructure {
  [path: string]: string; // path -> content
}

export async function createTestStructure(
  baseDir: string,
  structure: TestFileStructure
): Promise<void> {
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = join(baseDir, filePath);
    const dir = dirname(fullPath);

    // Create parent directories
    await mkdir(dir, { recursive: true });

    // Write file
    await Bun.write(fullPath, content);
  }
}

export function createTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cleanupTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

export async function setFileModificationTime(
  filePath: string,
  mtime: Date
): Promise<void> {
  const fd = await open(filePath, 'r+');
  await fd.utimes(mtime, mtime);
  await fd.close();
}
```

## Test Execution Commands

```bash
# Run all file-tools tests
turbo test:unit --filter=@buster/ai -- file-tools

# Run integration tests only
turbo test:integration --filter=@buster/ai -- file-tools

# Run specific tool tests
turbo test:unit --filter=@buster/ai -- bash-tool
turbo test:integration --filter=@buster/ai -- bash-tool.int

# Run with coverage
turbo test:unit --filter=@buster/ai -- --coverage file-tools
```

## Success Criteria

- ✅ All 8 tools have unit tests
- ✅ All 8 tools have integration tests
- ✅ Integration tests use real /tmp filesystem
- ✅ Cross-platform compatibility verified
- ✅ 100% of file-tools have test coverage
- ✅ All tests pass in CI/CD pipeline
- ✅ Test execution time < 30 seconds total
