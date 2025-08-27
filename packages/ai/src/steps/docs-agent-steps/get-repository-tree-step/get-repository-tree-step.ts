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
export async function runGetRepositoryTreeStep(
  input: GetRepositoryTreeStepInput
): Promise<GetRepositoryTreeStepOutput> {
  const validatedInput = GetRepositoryTreeStepInputSchema.parse(input);

  // TODO: Implement actual repository tree generation
  // For now, return a basic tree structure
  const repositoryTree = `
Repository Structure:
├── src/
│   ├── components/
│   ├── utils/
│   └── index.ts
├── tests/
├── package.json
└── README.md
`;

  return {
    message: validatedInput.message,
    organizationId: validatedInput.organizationId,
    context: validatedInput.context,
    repositoryTree: repositoryTree.trim(),
  };
}