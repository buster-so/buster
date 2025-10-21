import { readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

/**
 * Gets the current working directory (cross-platform)
 */
export function getCurrentWorkingDirectory(): string {
  return resolve(process.cwd());
}

/**
 * Directories and files to ignore in tree output
 */
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'target',
  'dbt_packages',
  '.next',
  '.turbo',
  'coverage',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
];

/**
 * Checks if a path should be ignored
 */
function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.includes(name) || name.startsWith('.');
}

/**
 * Recursively builds a tree structure
 */
function buildTree(
  dir: string,
  prefix: string = '',
  maxDepth: number,
  currentDepth: number = 0
): string[] {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const lines: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => !shouldIgnore(entry.name))
      .sort((a, b) => {
        // Directories first, then alphabetically
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const newPrefix = prefix + (isLast ? '    ' : '│   ');

      lines.push(prefix + connector + entry.name + (entry.isDirectory() ? '/' : ''));

      // Recurse into directories
      if (entry.isDirectory()) {
        const subDir = join(dir, entry.name);
        const subLines = buildTree(subDir, newPrefix, maxDepth, currentDepth + 1);
        lines.push(...subLines);
      }
    });
  } catch (error) {
    // Skip directories we can't read (permissions, etc.)
  }

  return lines;
}

/**
 * Gets a tree view of the working directory
 * Pure Node.js implementation - works on all platforms (Windows, Mac, Linux)
 */
export function getDirectoryTree(cwd: string, maxDepth = 2): string {
  const baseName = cwd.split(sep).pop() || cwd;
  const lines = [baseName + '/', ...buildTree(cwd, '', maxDepth)];
  return lines.join('\n');
}

/**
 * Formats working directory info for the agent system prompt
 */
export function formatWorkingDirectoryContext(cwd: string): string {
  const tree = getDirectoryTree(cwd, 2); // Top 2 levels only

  return `Working Directory: ${cwd}

Directory Structure:
\`\`\`
${tree}
\`\`\``;
}
