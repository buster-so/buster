import { runTypescript } from '@buster/sandbox';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import {
  type DocsAgentContext,
  DocsAgentContextKeys,
} from '../../../../context/docs-agent-context';

export interface GitCommitResult {
  attempted: boolean;
  success: boolean;
  commitHash?: string;
  errorMessage?: string;
}

/**
 * Creates a git checkpoint commit after successful file operations
 * @param description - User-provided description of what was done
 * @param runtimeContext - The runtime context containing sandbox reference
 * @returns GitCommitResult with commit status and details
 */
export async function createGitCheckpoint(
  description: string,
  runtimeContext: RuntimeContext<DocsAgentContext>
): Promise<GitCommitResult> {
  const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox);

  if (!sandbox) {
    return {
      attempted: false,
      success: false,
      errorMessage: 'Git commit requires sandbox environment',
    };
  }

  try {
    // First, check if we're in a git repository
    const gitStatusCode = `
const { execSync } = require('child_process');

try {
  const output = execSync('git status --porcelain', { encoding: 'utf8' });
  console.log(JSON.stringify({ success: true, output: output.trim() }));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error.message }));
  process.exit(1);
}
`;

    const gitStatusResult = await runTypescript(sandbox, gitStatusCode);

    if (gitStatusResult.exitCode !== 0) {
      const _result = JSON.parse(gitStatusResult.result.trim());
      return {
        attempted: false,
        success: false,
        errorMessage: 'Not in a git repository or git not available',
      };
    }

    // Check if there are any changes to commit
    const statusData = JSON.parse(gitStatusResult.result.trim());
    if (!statusData.output) {
      return {
        attempted: false,
        success: false,
        errorMessage: 'No changes detected to commit',
      };
    }

    // Stage all changes and create commit
    const commitCode = `
const { execSync } = require('child_process');

try {
  // Stage all changes
  execSync('git add .', { encoding: 'utf8' });
  
  // Create the commit with automated checkpoint message
  const commitMessage = ${JSON.stringify(`checkpoint: ${description}\n\n🤖 Automated file operation checkpoint`)};
  execSync(\`git commit -m "\${commitMessage}"\`, { encoding: 'utf8' });
  
  // Get the commit hash
  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8);
  
  console.log(JSON.stringify({ success: true, commitHash }));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error.message }));
  process.exit(1);
}
`;

    const commitResult = await runTypescript(sandbox, commitCode);

    if (commitResult.exitCode !== 0) {
      const result = JSON.parse(commitResult.result.trim());
      return {
        attempted: true,
        success: false,
        errorMessage: `Failed to create commit: ${result.error || 'Unknown error'}`,
      };
    }

    const commitData = JSON.parse(commitResult.result.trim());
    return {
      attempted: true,
      success: true,
      commitHash: commitData.commitHash,
    };
  } catch (error) {
    return {
      attempted: true,
      success: false,
      errorMessage: `Git commit error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Utility function to determine if any file operations were successful
 * Used to decide whether to attempt a git commit
 */
export function hasSuccessfulOperations(results: Array<{ status: string }>): boolean {
  return results.some((result) => result.status === 'success');
}
