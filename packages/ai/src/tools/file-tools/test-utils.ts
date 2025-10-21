import { mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export interface TestFileStructure {
  [path: string]: string; // path -> content
}

/**
 * Creates a test directory structure with files and content
 * @param baseDir - The base directory to create the structure in
 * @param structure - Object mapping file paths to their content
 */
export async function createTestStructure(
  baseDir: string,
  structure: TestFileStructure
): Promise<void> {
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = join(baseDir, filePath);
    const dir = dirname(fullPath);

    // Create parent directories
    mkdirSync(dir, { recursive: true });

    // Write file
    writeFileSync(fullPath, content, 'utf8');
  }
}

/**
 * Creates a temporary directory with a unique name
 * @param prefix - Prefix for the temp directory name
 * @returns Path to the created temp directory (with symlinks resolved)
 */
export function createTempDir(prefix: string): string {
  const tempPath = mkdtempSync(join(tmpdir(), prefix));
  // Resolve symlinks (e.g., /var -> /private/var on macOS)
  return realpathSync(tempPath);
}

/**
 * Removes a directory and all its contents
 * @param dir - Directory path to remove
 */
export function cleanupTempDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup temp dir ${dir}:`, error);
  }
}

/**
 * Sets the modification time of a file
 * @param filePath - Path to the file
 * @param mtime - Modification time to set
 */
export function setFileModificationTime(filePath: string, mtime: Date): void {
  const timestamp = mtime.getTime() / 1000;
  utimesSync(filePath, timestamp, timestamp);
}

/**
 * Creates a test file with specific modification time
 * @param filePath - Path to the file
 * @param content - File content
 * @param mtime - Modification time
 */
export async function createTestFile(
  filePath: string,
  content: string,
  mtime?: Date
): Promise<void> {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, 'utf8');

  if (mtime) {
    setFileModificationTime(filePath, mtime);
  }
}

/**
 * Generates a large text file with specified number of lines
 * @param lineCount - Number of lines to generate
 * @param lineTemplate - Template function for each line (receives line number)
 * @returns Generated text content
 */
export function generateLargeFile(
  lineCount: number,
  lineTemplate: (lineNum: number) => string = (n) => `Line ${n}`
): string {
  const lines: string[] = [];
  for (let i = 1; i <= lineCount; i++) {
    lines.push(lineTemplate(i));
  }
  return lines.join('\n');
}

/**
 * Creates a nested directory structure for testing
 * @param baseDir - Base directory
 * @returns Object with paths to created directories and files
 */
export async function createNestedStructure(baseDir: string) {
  const structure: TestFileStructure = {
    'src/index.ts': 'export const foo = 1;',
    'src/utils/helpers.ts': 'export function helper() { return "help"; }',
    'src/utils/types.ts': 'export type User = { id: string };',
    'src/components/Button.tsx': 'export const Button = () => <button />;',
    'tests/unit/helpers.test.ts': 'describe("helpers", () => {});',
    'tests/integration/api.int.test.ts': 'describe("api", () => {});',
    'docs/README.md': '# Documentation',
    'docs/guides/getting-started.md': '# Getting Started',
    'package.json': '{"name": "test-project"}',
    '.gitignore': 'node_modules\n.env',
    '.env': 'SECRET_KEY=test123',
  };

  await createTestStructure(baseDir, structure);

  return {
    structure,
    paths: {
      src: join(baseDir, 'src'),
      tests: join(baseDir, 'tests'),
      docs: join(baseDir, 'docs'),
      indexFile: join(baseDir, 'src/index.ts'),
      helpersFile: join(baseDir, 'src/utils/helpers.ts'),
      readmeFile: join(baseDir, 'docs/README.md'),
      packageJson: join(baseDir, 'package.json'),
      gitignore: join(baseDir, '.gitignore'),
      envFile: join(baseDir, '.env'),
    },
  };
}
