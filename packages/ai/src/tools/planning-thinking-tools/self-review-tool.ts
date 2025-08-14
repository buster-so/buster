import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for Self Review
interface SelfReviewParams {
  review_thoughts: string;
  ready_to_complete: boolean;
}

interface SelfReviewOutput {
  success: boolean;
}

// Zod schema for input validation
const selfReviewSchema = z.object({
  review_thoughts: z
    .string()
    .min(1)
    .describe(
      'Your self-review thoughts based on the done_rubric. Go through each point systematically: metrics creation, visualization guidelines, report rules/guidelines, completion checklist, metric/report self-reflection, and communication rules. Write detailed thoughts about your current state and what still needs to be done.'
    ),
  ready_to_complete: z
    .boolean()
    .describe(
      'Whether you are ready to call the done tool based on your self-review against the done_rubric. Only set to true if ALL criteria in the done_rubric are satisfied.'
    ),
});

/**
 * Optimistic parsing function for streaming self-review tool arguments
 * Extracts key fields as they're being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof selfReviewSchema>> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    const result: Partial<z.infer<typeof selfReviewSchema>> = {};

    if (parsed.review_thoughts !== undefined) {
      result.review_thoughts = parsed.review_thoughts;
    }
    if (parsed.ready_to_complete !== undefined) {
      result.ready_to_complete = parsed.ready_to_complete;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    // Only catch JSON parse errors - let other errors bubble up
    if (error instanceof SyntaxError) {
      // JSON parsing failed - try regex extraction for partial content
      const result: Partial<z.infer<typeof selfReviewSchema>> = {};

      // Extract review_thoughts
      const thoughtsMatch = accumulatedText.match(/"review_thoughts"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (thoughtsMatch && thoughtsMatch[1] !== undefined) {
        const unescaped = thoughtsMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        result.review_thoughts = unescaped;
      }

      // Extract ready_to_complete
      const readyMatch = accumulatedText.match(/"ready_to_complete"\s*:\s*(true|false)/);
      if (readyMatch && readyMatch[1] !== undefined) {
        result.ready_to_complete = readyMatch[1] === 'true';
      }

      // Try to extract partial string that's still being built (incomplete quote)
      if (!result.review_thoughts) {
        const partialThoughtsMatch = accumulatedText.match(
          /"review_thoughts"\s*:\s*"((?:[^"\\]|\\.*)*)/
        );
        if (partialThoughtsMatch && partialThoughtsMatch[1] !== undefined) {
          const unescaped = partialThoughtsMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          result.review_thoughts = unescaped;
        }
      }

      // Return result if we found at least one field, otherwise null
      return Object.keys(result).length > 0 ? result : null;
    }
    // Unexpected error - re-throw with context
    throw new Error(
      `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Tool implementation
export const selfReview = createTool({
  id: 'self-review',
  description: `A self-review tool for the analyst agent to evaluate readiness before calling done.

**When to use this tool:**
- Before calling the done tool to ensure all requirements are met
- To systematically review your work against the done_rubric
- When you need to evaluate if metrics, reports, or dashboards are complete
- To check compliance with visualization guidelines and communication rules

**Key evaluation areas from done_rubric:**
1. **Metrics Creation**: Have I created all needed metrics to answer the user's question?
2. **Visualization Guidelines**: Do all metrics follow the visualization and charting guidelines?
3. **Report Handling**: If building a report, did I follow all report rules and guidelines?
4. **Self-Reflection**: Do I pass the metric_self_reflection and report_self_reflection checks?
5. **Completion Checklist**: Do I satisfy all points in the completion checklist?
6. **Communication Rules**: Does my planned done message follow the communication rules?

**You should:**
1. Systematically review each criterion in the done_rubric
2. Be honest about gaps or incomplete work
3. Only set ready_to_complete to true when ALL criteria are satisfied
4. Use this review to identify what work remains before calling done
5. Include specific details about your current state and any remaining tasks`,
  inputSchema: selfReviewSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the self-review was processed successfully'),
  }),
  execute: async ({ context }) => {
    return await processSelfReview(context as SelfReviewParams);
  },
});

const processSelfReview = wrapTraced(
  async (params: SelfReviewParams): Promise<SelfReviewOutput> => {
    try {
      // Process the self-review with validated context
      await processReview(params);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in self-review:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid self-review parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `Self-review processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'self-review' }
);

async function processReview(params: SelfReviewParams): Promise<SelfReviewParams> {
  return {
    review_thoughts: params.review_thoughts.trim(),
    ready_to_complete: params.ready_to_complete,
  };
}

export default selfReview;
