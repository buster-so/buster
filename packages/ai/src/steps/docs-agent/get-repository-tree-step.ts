import type { Sandbox } from '@buster/sandbox';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import { DocsAgentContextKeys, DocsAgentContextSchema } from '../../context/docs-agent-context';
import { getRepositoryTree } from '../../workflows/docs-agent/helpers/tree-helper';

// Input schema - receives data from initialize-context step
const getRepositoryTreeStepInputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  contextInitialized: z.boolean(),
  context: DocsAgentContextSchema,
});

// Output schema - passes through all input data plus the tree structure
const getRepositoryTreeStepOutputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  contextInitialized: z.boolean(),
  context: DocsAgentContextSchema,
  repositoryTree: z.string().describe('The tree structure of the repository'),
});

const getRepositoryTreeExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof getRepositoryTreeStepInputSchema>;
  runtimeContext: RuntimeContext;
}): Promise<z.infer<typeof getRepositoryTreeStepOutputSchema>> => {
  try {
    // Get the sandbox from runtime context
    const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox) as Sandbox;

    if (!sandbox) {
      console.warn('[GetRepositoryTree] No sandbox available, skipping tree generation');
      return {
        ...inputData,
        repositoryTree: '',
      };
    }

    console.info('[GetRepositoryTree] Generating repository tree structure');

    // Get current working directory
    const pwdResult = await sandbox.process.executeCommand('pwd');
    const currentDir = pwdResult.result.trim();

    // Get the tree structure with gitignore option enabled
    const treeResult = await getRepositoryTree(sandbox, '.', {
      gitignore: true,
      maxDepth: 10, // Limit depth to avoid extremely large outputs
    });

    if (!treeResult.success || !treeResult.output) {
      console.warn('[GetRepositoryTree] Failed to generate tree:', treeResult.error);
      return {
        ...inputData,
        repositoryTree: '',
      };
    }

    // Prepend current directory info to tree output
    const treeWithLocation = `<YOU ARE HERE: ${currentDir}>\n\n${treeResult.output}`;

    console.info('[GetRepositoryTree] Tree structure generated successfully', {
      outputLength: treeResult.output.length,
      command: treeResult.command,
      currentDirectory: currentDir,
    });

    // Store the tree in runtime context for potential use by other steps
    runtimeContext.set('repositoryTree', treeWithLocation);

    // Return the data with the tree structure added
    return {
      ...inputData,
      repositoryTree: treeWithLocation,
    };
  } catch (error) {
    console.error('[GetRepositoryTree] Error generating repository tree:', error);
    // Don't fail the entire workflow if tree generation fails
    return {
      ...inputData,
      repositoryTree: '',
    };
  }
};

export const getRepositoryTreeStep = createStep({
  id: 'get-repository-tree',
  description: 'Generates a tree structure of the repository using the tree command',
  inputSchema: getRepositoryTreeStepInputSchema,
  outputSchema: getRepositoryTreeStepOutputSchema,
  execute: getRepositoryTreeExecution,
});
