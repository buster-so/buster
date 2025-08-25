import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { GPT5Mini } from '../../../llm/gpt-5-mini';
import { formatAnalysisTypeRouterPrompt } from './format-analysis-type-router-prompt';

// Zod schemas first - following Zod-first approach
export const analysisTypeRouterParamsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The conversation history'),
});

export const analysisTypeRouterResultSchema = z.object({
  analysisType: z.enum(['standard', 'investigation']).describe('The chosen analysis type'),
  reasoning: z.string().describe('Explanation for why this analysis type was chosen'),
});

// Export types from schemas
export type AnalysisTypeRouterParams = z.infer<typeof analysisTypeRouterParamsSchema>;
export type AnalysisTypeRouterResult = z.infer<typeof analysisTypeRouterResultSchema>;

// Schema for what the LLM returns
const llmOutputSchema = z.object({
  choice: z.enum(['standard', 'investigation']).describe('The type of analysis to perform'),
  reasoning: z.string().describe('Explanation for why this analysis type was chosen'),
});

/**
 * Generates the analysis type decision using the LLM
 */
async function generateAnalysisTypeWithLLM(messages: ModelMessage[]): Promise<{
  choice: 'standard' | 'investigation';
  reasoning: string;
}> {
  try {
    // Get the last user message for context
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === 'user');
    const userPrompt = lastUserMessage?.content?.toString() || '';

    // Format the system prompt
    const systemPrompt = formatAnalysisTypeRouterPrompt({
      userPrompt,
      conversationHistory: messages.length > 1 ? messages : [],
    });

    // Prepare messages for the LLM
    const systemMessage: ModelMessage = {
      role: 'system',
      content: systemPrompt,
    };

    const llmMessages = [systemMessage, ...messages];

    const tracedAnalysisType = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: await GPT5Mini,
          schema: llmOutputSchema,
          messages: llmMessages,
          temperature: 1,
          providerOptions: {
            openai: {
              parallelToolCalls: false,
              reasoningEffort: 'minimal',
              verbosity: 'low',
            },
          },
        });

        return object;
      },
      {
        name: 'GenerateAnalysisType',
        spanAttributes: {
          messageCount: messages.length,
        },
      }
    );

    const result = await tracedAnalysisType();
    return {
      choice: result.choice,
      reasoning: result.reasoning,
    };
  } catch (llmError) {
    console.warn('[AnalysisTypeRouter] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    // Default to standard analysis on error
    return {
      choice: 'standard',
      reasoning: 'Defaulting to standard analysis due to routing error',
    };
  }
}

export async function runAnalysisTypeRouterStep(
  params: AnalysisTypeRouterParams
): Promise<AnalysisTypeRouterResult> {
  try {
    const result = await generateAnalysisTypeWithLLM(params.messages);

    console.info('[Analysis Type Router] Decision:', {
      choice: result.choice,
      reasoning: result.reasoning,
    });

    return {
      analysisType: result.choice,
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('[analysis-type-router-step] Unexpected error:', error);
    // Default to standard analysis on error
    return {
      analysisType: 'standard',
      reasoning: 'Defaulting to standard analysis due to routing error',
    };
  }
}
