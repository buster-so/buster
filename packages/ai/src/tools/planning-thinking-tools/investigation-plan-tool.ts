import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for Investigation Plan
interface InvestigationPlanParams {
  current_progress: string;
  remaining_investigations: string;
  next_research_steps: string;
  continue_research: boolean;
}

interface InvestigationPlanOutput {
  success: boolean;
}

// Zod schema for input validation
const investigationPlanSchema = z.object({
  current_progress: z
    .string()
    .min(1)
    .describe(
      'Summary of research progress made so far. What have you discovered? What hypotheses have you tested? What new questions have emerged from your findings?'
    ),
  remaining_investigations: z
    .string()
    .min(1)
    .describe(
      'What areas still need exploration? What patterns require deeper investigation? What questions do you have about the data that you should investigate? List specific tables, columns, and analytical approaches you plan to use.'
    ),
  next_research_steps: z
    .string()
    .min(1)
    .describe(
      'What should you investigate next based on your findings? Provide 3-6 specific, actionable research items. For each item, name the table(s) and key column(s) you will query and tag the analytical angle (time trend, segment comparison, distribution/outliers, descriptive fields, correlation, lifecycle/funnel).'
    ),
  continue_research: z
    .boolean()
    .describe(
      'Whether additional research is needed. Only set to false when: all major hypotheses are tested, anomalies are explained, segments are fully investigated with descriptive fields, and you have comprehensive evidence for all planned claims. Set to true if ANY research opportunities remain that could yield valuable insights.'
    ),
});

/**
 * Optimistic parsing function for streaming investigation-plan tool arguments
 * Extracts key fields as they're being built incrementally
 */
export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof investigationPlanSchema>> | null {
  // Validate input type
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    // First try to parse as complete JSON
    const parsed = JSON.parse(accumulatedText);
    const result: Partial<z.infer<typeof investigationPlanSchema>> = {};

    if (parsed.current_progress !== undefined) {
      result.current_progress = parsed.current_progress;
    }
    if (parsed.remaining_investigations !== undefined) {
      result.remaining_investigations = parsed.remaining_investigations;
    }
    if (parsed.next_research_steps !== undefined) {
      result.next_research_steps = parsed.next_research_steps;
    }
    if (parsed.continue_research !== undefined) {
      result.continue_research = parsed.continue_research;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    // Only catch JSON parse errors - let other errors bubble up
    if (error instanceof SyntaxError) {
      // JSON parsing failed - try regex extraction for partial content
      const result: Partial<z.infer<typeof investigationPlanSchema>> = {};

      // Extract current_progress
      const progressMatch = accumulatedText.match(/"current_progress"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (progressMatch && progressMatch[1] !== undefined) {
        const unescaped = progressMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        result.current_progress = unescaped;
      }

      // Extract remaining_investigations
      const remainingMatch = accumulatedText.match(
        /"remaining_investigations"\s*:\s*"((?:[^"\\]|\\.)*)"/
      );
      if (remainingMatch && remainingMatch[1] !== undefined) {
        const unescaped = remainingMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        result.remaining_investigations = unescaped;
      }

      // Extract next_research_steps
      const stepsMatch = accumulatedText.match(/"next_research_steps"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (stepsMatch && stepsMatch[1] !== undefined) {
        const unescaped = stepsMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        result.next_research_steps = unescaped;
      }

      // Extract continue_research
      const continueMatch = accumulatedText.match(/"continue_research"\s*:\s*(true|false)/);
      if (continueMatch && continueMatch[1] !== undefined) {
        result.continue_research = continueMatch[1] === 'true';
      }

      // Try to extract partial strings that are still being built (incomplete quotes)
      if (!result.current_progress) {
        const partialProgressMatch = accumulatedText.match(
          /"current_progress"\s*:\s*"((?:[^"\\]|\\.*)*)/
        );
        if (partialProgressMatch && partialProgressMatch[1] !== undefined) {
          const unescaped = partialProgressMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          result.current_progress = unescaped;
        }
      }

      if (!result.remaining_investigations) {
        const partialRemainingMatch = accumulatedText.match(
          /"remaining_investigations"\s*:\s*"((?:[^"\\]|\\.*)*)/
        );
        if (partialRemainingMatch && partialRemainingMatch[1] !== undefined) {
          const unescaped = partialRemainingMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          result.remaining_investigations = unescaped;
        }
      }

      if (!result.next_research_steps) {
        const partialStepsMatch = accumulatedText.match(
          /"next_research_steps"\s*:\s*"((?:[^"\\]|\\.*)*)/
        );
        if (partialStepsMatch && partialStepsMatch[1] !== undefined) {
          const unescaped = partialStepsMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          result.next_research_steps = unescaped;
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
export const investigationPlan = createTool({
  id: 'investigation-plan',
  description: `A research planning tool to guide ongoing investigation after each sequential thinking step.

**When to use this tool:**
- After every sequentialThinking tool call (except the final one where nextThoughtNeeded is false)
- To systematically plan next research steps based on current findings
- To evaluate whether comprehensive investigation is complete
- To ensure no important research angles are missed

**Core evaluation areas from sequential thinking self-reflection:**
1. **Progress Assessment**: What hypotheses, metrics, or ideas do you currently have? Do you have enough information to properly explain them?
2. **Information Gaps**: What areas still need exploration? What patterns require deeper investigation?
3. **Research Planning**: What specific next steps will advance your understanding? Which tables and columns should you investigate?
4. **Descriptive Investigation**: Have you systematically investigated ALL descriptive fields for any segments you've created?
5. **Related Tables**: Have you explored all tables that relate to your current data segment?
6. **Research Completeness**: Have you thoroughly investigated all possible aspects of the data?

**Research continuation guidance:**
- Set continue_research to TRUE if any research opportunities remain that could yield valuable insights
- Set continue_research to FALSE only when comprehensive investigation is complete with robust evidence
- Consider: unexplored hypotheses, uninvestigated outliers, incomplete segment analysis, missing descriptive field investigation

**You should:**
1. Systematically assess your current research progress and findings
2. Identify specific gaps in your investigation 
3. Plan concrete next research steps with table/column details
4. Only indicate completion when investigation is truly comprehensive
5. Ensure all segments have been validated through descriptive field analysis`,
  inputSchema: investigationPlanSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the investigation plan was processed successfully'),
  }),
  execute: async ({ context }) => {
    return await processInvestigationPlan(context as InvestigationPlanParams);
  },
});

const processInvestigationPlan = wrapTraced(
  async (params: InvestigationPlanParams): Promise<InvestigationPlanOutput> => {
    try {
      // Process the investigation plan with validated context
      await processResearchPlan(params);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in investigation plan:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid investigation plan parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `Investigation plan processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'investigation-plan' }
);

async function processResearchPlan(
  params: InvestigationPlanParams
): Promise<InvestigationPlanParams> {
  return {
    current_progress: params.current_progress.trim(),
    remaining_investigations: params.remaining_investigations.trim(),
    next_research_steps: params.next_research_steps.trim(),
    continue_research: params.continue_research,
  };
}

export default investigationPlan;
