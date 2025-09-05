import { tool } from 'ai';
import { z } from 'zod';
import { createSequentialThinkingDelta } from './sequential-thinking-tool-delta';
import { createSequentialThinkingExecute } from './sequential-thinking-tool-execute';
import { createSequentialThinkingFinish } from './sequential-thinking-tool-finish';
import { createSequentialThinkingStart } from './sequential-thinking-tool-start';

export const SEQUENTIAL_THINKING_TOOL_NAME = 'sequentialThinking';

export const SequentialThinkingInputSchema = z.object({
  thought: z
    .string()
    .min(1)
    .describe(
      'Your current thinking step, which can include: Regular analytical steps, Revisions of previous thoughts, Questions about previous decisions, Realizations about needing more analysis, Changes in approach, Hypothesis generation, Hypothesis verification.'
    ),
  nextThoughtNeeded: z.boolean().describe('Whether another thought step is needed.'),
  thoughtNumber: z.number().int().positive().describe('Current number in sequence.'),
});

const SequentialThinkingOutputSchema = z.object({
  success: z.boolean().describe('Whether the thinking step was processed successfully'),
});

const SequentialThinkingContextSchema = z.object({
  messageId: z
    .string()
    .describe('The message ID of the message that triggered the sequential thinking'),
});

const SequentialThinkingStateSchema = z.object({
  toolCallId: z
    .string()
    .optional()
    .describe(
      'The entry ID of the reasoning entry. This is optional and will be set by the tool start'
    ),
  args: z.string().optional().describe('The accumulated arguments of the sequential thinking tool'),
  thought: z
    .string()
    .optional()
    .describe('The current thought. This is optional and will be set by the tool delta and finish'),
  nextThoughtNeeded: z
    .boolean()
    .optional()
    .describe(
      'Whether another thought step is needed. This is optional and will be set by the tool delta and finish'
    ),
  thoughtNumber: z
    .number()
    .optional()
    .describe(
      'Current number in sequence. This is optional and will be set by the tool delta and finish'
    ),
  startTime: z.number().optional().describe('The start time of the thinking process'),
  isComplete: z.boolean().optional().describe('Whether the thinking process is complete'),
});

export type SequentialThinkingInput = z.infer<typeof SequentialThinkingInputSchema>;
export type SequentialThinkingOutput = z.infer<typeof SequentialThinkingOutputSchema>;
export type SequentialThinkingContext = z.infer<typeof SequentialThinkingContextSchema>;
export type SequentialThinkingState = z.infer<typeof SequentialThinkingStateSchema>;

export function createSequentialThinkingTool(context: SequentialThinkingContext) {
  const state: SequentialThinkingState = {
    toolCallId: undefined,
    args: undefined,
    thought: undefined,
    nextThoughtNeeded: undefined,
    thoughtNumber: undefined,
    startTime: undefined,
    isComplete: undefined,
  };

  const execute = createSequentialThinkingExecute(state, context);
  const onInputStart = createSequentialThinkingStart(state, context);
  const onInputDelta = createSequentialThinkingDelta(state, context);
  const onInputAvailable = createSequentialThinkingFinish(state, context);

  return tool({
    description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

**When to use this tool:**
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

**Key features:**
- You can question or revise previous thoughts
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer

**You should:**
1. Feel free to question or revise previous thoughts
2. Express uncertainty when present
3. Ignore information that is irrelevant to the current step
4. Generate a solution hypothesis when appropriate
5. Verify the hypothesis based on the Chain of Thought steps
6. Repeat the process until satisfied with the solution
7. Provide a single, ideally correct answer as the final output
8. Only set nextThoughtNeeded to false when truly done and a satisfactory answer is reached`,
    inputSchema: SequentialThinkingInputSchema,
    outputSchema: SequentialThinkingOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
