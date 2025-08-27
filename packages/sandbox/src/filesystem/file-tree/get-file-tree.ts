import type { Sandbox } from '@daytonaio/sdk';

export async function getSandboxFileTree(sandbox: Sandbox): Promise<string> {
  // Run tree command with:
  // -a: show hidden files
  // -L 20: go 20 levels deep
  // -F: append indicators (/ for dirs, * for executables, etc)
  // -I: ignore patterns for node_modules and .git to keep output manageable
  const treeCommand = 'tree -a -L 20 -F -I "node_modules|.git"';

  const result = await sandbox.process.executeCommand(treeCommand, '/home/daytona/');

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get sandbox file tree: ${result.result}`);
  }

  return result.result;
}
