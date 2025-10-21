import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/**
 * Generates a directory tree structure using the `tree` command if available,
 * otherwise falls back to a simple ls-based approach
 */
export function generateDirectoryTree(workingDirectory: string): string {
  if (!workingDirectory || !existsSync(workingDirectory)) {
    return 'Working directory not provided or does not exist';
  }

  try {
    // Try using the tree command if available (limiting depth and excluding common ignore patterns)
    const treeOutput = execSync(
      `tree -L 3 -I 'node_modules|.git|dist|build|.next|.turbo|target' "${workingDirectory}"`,
      {
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024, // 1MB max
        timeout: 5000, // 5 second timeout
      }
    );
    return treeOutput.trim();
  } catch (error) {
    // Fallback to ls -R if tree is not available
    try {
      const lsOutput = execSync(
        `find "${workingDirectory}" -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' | head -200`,
        {
          encoding: 'utf-8',
          maxBuffer: 1024 * 1024,
          timeout: 5000,
        }
      );
      return `Directory listing (limited to depth 3):\n${lsOutput.trim()}`;
    } catch (_fallbackError) {
      return `Unable to generate directory tree: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

/**
 * Creates the working directory context message for the system prompt
 */
export function createWorkingDirectoryContext(workingDirectory: string | undefined): string {
  if (!workingDirectory) {
    return '';
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const tree = generateDirectoryTree(workingDirectory);

  return `
## Working Environment

**Current Working Directory:** ${workingDirectory}
**Date:** ${currentDate}

**Directory Structure:**
\`\`\`
${tree}
\`\`\`
`.trim();
}
