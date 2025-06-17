import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for Sequential Thinking
interface SequentialThinkingParams {
  thought: string;
  thoughtNumber: number;
  nextThoughtNeeded: boolean;
  totalThoughts: number;
  needMoreTotalThoughts: boolean;
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
      'Your current thinking step in the data analysis process, which can include: Regular analytical steps, Revisions of previous thoughts, Questions about previous decisions, Realizations about needing more information, Changes in approach, Hypothesis generation, Hypothesis verification.'
    ),
  thoughtNumber: z
    .number()
    .int()
    .positive()
    .describe('The current step number (can exceed the initial totalThoughts if extended).'),
  nextThoughtNeeded: z
    .boolean()
    .describe('Set to true if more thinking is needed, even at the apparent end.'),
  totalThoughts: z
    .number()
    .int()
    .positive()
    .describe('Your current estimate of needed thoughts (adjustable as you go).'),
  needMoreTotalThoughts: z
    .boolean()
    .describe(
      'Set to true if nearing your `totalThoughts` limit but you still need more steps (e.g., to run queries or explore further).'
    ),
});

/**
 * Optimistic parsing function for streaming sequential-thinking tool arguments
 * Extracts key fields as they're being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof sequentialThinkingSchema>> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    const result: Partial<z.infer<typeof sequentialThinkingSchema>> = {};

    // Only include fields that are actually present
    if (parsed.thought !== undefined) result.thought = parsed.thought;
    if (parsed.thoughtNumber !== undefined) result.thoughtNumber = parsed.thoughtNumber;
    if (parsed.nextThoughtNeeded !== undefined) result.nextThoughtNeeded = parsed.nextThoughtNeeded;
    if (parsed.totalThoughts !== undefined) result.totalThoughts = parsed.totalThoughts;
    if (parsed.needMoreTotalThoughts !== undefined)
      result.needMoreTotalThoughts = parsed.needMoreTotalThoughts;

    return result;
  } catch (error) {
    // Only catch JSON parse errors - let other errors bubble up
    if (error instanceof SyntaxError) {
      // If JSON is incomplete, try to extract partial fields
      const result: Partial<z.infer<typeof sequentialThinkingSchema>> = {};

      // Extract thought field (main text content)
      const thoughtMatch = accumulatedText.match(/"thought"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (thoughtMatch && thoughtMatch[1] !== undefined) {
        result.thought = thoughtMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      } else {
        // Try to extract incomplete thought string
        const partialThoughtMatch = accumulatedText.match(/"thought"\s*:\s*"((?:[^"\\]|\\.*)*)/);
        if (partialThoughtMatch && partialThoughtMatch[1] !== undefined) {
          result.thought = partialThoughtMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
      }

      // Extract boolean fields
      const nextThoughtMatch = accumulatedText.match(/"nextThoughtNeeded"\s*:\s*(true|false)/);
      if (nextThoughtMatch) {
        result.nextThoughtNeeded = nextThoughtMatch[1] === 'true';
      }

      const needMoreTotalThoughtsMatch = accumulatedText.match(
        /"needMoreTotalThoughts"\s*:\s*(true|false)/
      );
      if (needMoreTotalThoughtsMatch) {
        result.needMoreTotalThoughts = needMoreTotalThoughtsMatch[1] === 'true';
      }

      // Extract number fields
      const thoughtNumberMatch = accumulatedText.match(/"thoughtNumber"\s*:\s*(\d+)/);
      if (thoughtNumberMatch && thoughtNumberMatch[1] !== undefined) {
        result.thoughtNumber = Number.parseInt(thoughtNumberMatch[1], 10);
      }

      const totalThoughtsMatch = accumulatedText.match(/"totalThoughts"\s*:\s*(\d+)/);
      if (totalThoughtsMatch && totalThoughtsMatch[1] !== undefined) {
        result.totalThoughts = Number.parseInt(totalThoughtsMatch[1], 10);
      }

      // Return result if we found at least one field
      return Object.keys(result).length > 0 ? result : null;
    }

    // Unexpected error - re-throw with context
    throw new Error(
      `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Tool implementation
export const sequentialThinking = createTool({
  id: 'sequential-thinking',
  description: `A detailed tool for dynamic and reflective problem-solving through thoughts.needMoreTotalThoughtsThis tool is uesd to address, think through, and check off TODO list items through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

**When to use this tool:**  
- Thinking through and checking off items on your TODO list
- Assessing available documentation
- Identifying when to verify information that isn't explicitly avilable in the documentation.
- Identifying when requested data does not exist
- Thoroughly think through and document assumptions
- Deciding if you need to ask the user clarifying questions
- Defining a term or metrics mentioned in the request.
- Defining time frames or date ranges that need to be specified.
- Determining specific values or enums required to identify product names, users, categories, etc.
- Determining which conditions or filters will need to be applied to the data.
- Determining what specific entities or things are, how to query for them, etc.

**Key features:**  
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generate hypothesese to accomplish TODO list items
- Verify these hypothesese based on the available documentation, running validation queries, and asking the user clarifying questions
- Repeats the process until satisfied
- Thoroughly preps required information for the analysis workflow

**Parameters Explained**
- **\`thought\`**: Your current step in the process. Could be:
  - An analytical step
  - A revision of a prior thought
  - A question about a previous decision
  - A realization you need more info
  - A change in approach
  - A hypothesis or its verification
- **\`thoughtNumber\`**: The current step number (can exceed the initial \`totalThoughts\` if extended)
- **\`nextThoughtNeeded\`**: Set to "true" if more thinking is needed, even at the apparent "end"
- **\`totalThoughts\`**: Your current estimate of needed thoughts (adjustable as you go)
- **\`needMoreTotalThoughts\`**: Set to "true" when nearing your \`totalThoughts\` limit but you still need more steps (e.g., to run queries or explore further)

**How to Use It**
1. **Start with an estimate**: Set an initial \`totalThoughts\`, but treat it as a guess, not a rule.
2. **Revise freely**: Question or tweak earlier thoughts as new insights emerge.
3. **Extend when needed**: Add more thoughts if you're not done, even at the "end."
4. **Be uncertain**: Express doubts and explore options when unsure.
5. **Stay focused**: Ignore irrelevant info for the current step.
6. **Hypothesize and verify**: Propose solutions, then check them with documentation, queries, or questions.
7. **Iterate**: Keep going until satisfied.
8. **Finish cleanly**: End with a single, correct thought when ready.
9. **Control the end**: Only set \`nextThoughtNeeded\` to "false" when all prep is complete for the analysis workflow.
10. **Signal more thoughts**: Set \`needMoreTotalThoughts\` to "true" if you're nearing \`totalThoughts\` but need more steps (e.g., to run an \`executeSQL\` query and review results).

**You should:**  
1. Set an initial estimate of \`totalThoughts\` needed, but treat it as a guess, not a rule.
2. Feel free to question or revise previous thoughts
3. Don't hesitate to add more thoughts if needed, even at the "end"
4. Express uncertainty when present
5. Ignore information that is irrelevant to the current step
6. Generate a solution hypothesis when appropriate
7. Verify the hypothesis based on the Chain of Thought steps
8. Repeat the process until satisfied with the solution
9. Provide a single, ideally correct thought as the final output
10. Only set \`nextThoughtNeeded\` to "false" when all prep is complete for the analysis workflow.
11. Set \`needMoreTotalThoughts\` to "true" if you're nearing \`totalThoughts\` but need more steps (e.g., to run an \`executeSQL\` query and review results).

**Key guidelines for extending thoughts:**
- **\`totalThoughts\` is flexible**: This is an estimate, not a limit. Increase it if you need more steps.
- **Using \`needMoreTotalThoughts\`**: Set it to "true" when you're on your last planned thought (e.g., thought 3 of 3) but realize need to run additional queries with executeSQL and assess the results.
- **When to Extend**: If you hit your last thought and still have unresolved issues (e.g., need to use executeSQL again), set \`needMoreTotalThoughts\` to "true," bump up \`totalThoughts\`, and proceed.`,
  inputSchema: sequentialThinkingSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the thinking step was processed successfully'),
  }),
  execute: async ({ context }) => {
    return await processSequentialThinking(context as SequentialThinkingParams);
  },
});

const processSequentialThinking = wrapTraced(
  async (params: SequentialThinkingParams): Promise<SequentialThinkingOutput> => {
    try {
      // Process the thought with validated context
      await processThought(params);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in sequential thinking:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid sequential thinking parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `Sequential thinking processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'sequential-thinking' }
);

async function processThought(params: SequentialThinkingParams): Promise<SequentialThinkingParams> {
  return {
    thought: params.thought.trim(),
    thoughtNumber: params.thoughtNumber,
    nextThoughtNeeded: params.nextThoughtNeeded,
    totalThoughts: params.totalThoughts,
    needMoreTotalThoughts: params.needMoreTotalThoughts,
  };
}
