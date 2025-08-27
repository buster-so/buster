import { getSandboxFileTree } from '@buster/sandbox/filesystem/file-tree/get-file-tree';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { DocsAgentContextSchema } from '../../../agents/docs-agent/docs-agent-context';

// Input schema for the get repository tree step
export const GetRepositoryTreeStepInputSchema = z.object({
  message: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  contextInitialized: z.boolean().describe('Whether the context has been initialized'),
  context: DocsAgentContextSchema.describe('The docs agent context'),
});

// Output schema for the get repository tree step
export const GetRepositoryTreeStepOutputSchema = z.object({
  message: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  context: DocsAgentContextSchema.describe('The docs agent context'),
  repositoryTree: z.string().describe('The repository tree structure'),
});

export type GetRepositoryTreeStepInput = z.infer<typeof GetRepositoryTreeStepInputSchema>;
export type GetRepositoryTreeStepOutput = z.infer<typeof GetRepositoryTreeStepOutputSchema>;

/**
 * Gets the repository tree structure for documentation generation
 */
export const runGetRepositoryTreeStep = wrapTraced(
  async (input: GetRepositoryTreeStepInput): Promise<GetRepositoryTreeStepOutput> => {
    const validatedInput = GetRepositoryTreeStepInputSchema.parse(input);

    // Get the actual file tree from the sandbox
    const repositoryTree = await getSandboxFileTree(validatedInput.context.sandbox);

    return {
      message: validatedInput.message,
      organizationId: validatedInput.organizationId,
      context: validatedInput.context,
      repositoryTree: repositoryTree.trim(),
    };
  },
  { name: 'Get Repository Tree Step' }
);
