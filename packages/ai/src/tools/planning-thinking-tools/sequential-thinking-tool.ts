import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for Sequential Thinking
interface SequentialThinkingParams {
  thought: string;
  nextThoughtNeeded: boolean;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts: boolean;
}

interface SequentialThinkingOutput {
  success: boolean;
}

// Zod schema for input validation
const sequentialThinkingSchema = z.object({
  thought: z
    .string()
    .min(1)
    .describe(
      'Your current thinking step, which can include: Regular analytical steps, Revisions of previous thoughts, Questions about previous decisions, Realizations about needing more analysis, Changes in approach, Hypothesis generation, Hypothesis verification.'
    ),
  nextThoughtNeeded: z.boolean().describe('Whether another thought step is needed.'),
  thoughtNumber: z
    .number()
    .int()
    .positive()
    .describe('Current number in sequence (can go beyond initial total if needed).'),
  totalThoughts: z
    .number()
    .int()
    .positive()
    .describe('Current estimate of thoughts needed (can be adjusted up/down).'),
  isRevision: z
    .boolean()
    .describe('A boolean indicating if this thought revises previous thinking.'),
  revisesThought: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('If is_revision is true, which thought number is being reconsidered.'),
  branchFromThought: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('If branching, which thought number is the branching point.'),
  branchId: z.string().optional().describe('Identifier for the current branch (if any).'),
  needsMoreThoughts: z.boolean().describe('If reaching end but realizing more thoughts needed.'),
});

// Tool implementation
export const sequentialThinking = createTool({
  id: 'sequential-thinking',
  description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

**When to use this tool:**
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

**Key features:**
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer

**You should:**
1. Start with an initial estimate of needed thoughts, but be ready to adjust
2. Feel free to question or revise previous thoughts
3. Don't hesitate to add more thoughts if needed, even at the "end"
4. Express uncertainty when present
5. Mark thoughts that revise previous thinking or branch into new paths
6. Ignore information that is irrelevant to the current step
7. Generate a solution hypothesis when appropriate
8. Verify the hypothesis based on the Chain of Thought steps
9. Repeat the process until satisfied with the solution
10. Provide a single, ideally correct answer as the final output
11. Only set next_thought_needed to false when truly done and a satisfactory answer is reached`,
  inputSchema: sequentialThinkingSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the thinking step was processed successfully'),
  }),
  execute: async ({ context, runtimeContext }) => {
    return await processSequentialThinking(context as SequentialThinkingParams, runtimeContext);
  },
});

const processSequentialThinking = wrapTraced(
  async (
    params: SequentialThinkingParams,
    runtimeContext: RuntimeContext
  ): Promise<SequentialThinkingOutput> => {
    // Extract any relevant context values if needed
    const userId = runtimeContext?.get('userId') as string | undefined;
    const sessionId = runtimeContext?.get('sessionId') as string | undefined;

    // Validate the input parameters
    const validatedParams = sequentialThinkingSchema.parse(params);

    // Process the thought
    await processThought(validatedParams, userId, sessionId);

    return {
      success: true,
    };
  },
  { name: 'sequential-thinking' }
);

async function processThought(
  params: SequentialThinkingParams,
  _userId?: string,
  _sessionId?: string
): Promise<SequentialThinkingParams> {
  // This function can be extended to include additional processing logic
  // such as logging thoughts, analyzing patterns, or integrating with other systems

  // For now, we simply validate and return the processed thought
  // In the future, this could include:
  // - Storing thoughts in a database for session continuity
  // - Analyzing thought patterns for insights
  // - Providing suggestions for next steps
  // - Integrating with external knowledge bases

  return {
    thought: params.thought.trim(),
    nextThoughtNeeded: params.nextThoughtNeeded,
    thoughtNumber: params.thoughtNumber,
    totalThoughts: params.totalThoughts,
    isRevision: params.isRevision,
    revisesThought: params.revisesThought,
    branchFromThought: params.branchFromThought,
    branchId: params.branchId,
    needsMoreThoughts: params.needsMoreThoughts,
  };
}
