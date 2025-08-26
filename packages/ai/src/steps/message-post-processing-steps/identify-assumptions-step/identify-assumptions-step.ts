import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Sonnet4 } from '../../../llm/sonnet-4';
import { MessageHistorySchema } from '../../../utils/memory/types';
import { getIdentifyAssumptionsSystemMessage } from './get-identify-assumptions-system-message';

// Simplified input schema - only include necessary fields
export const identifyAssumptionsStepInputSchema = z.object({
  conversationHistory: MessageHistorySchema.optional(),
  userName: z.string().describe('User name for context'),
  datasets: z.string().describe('Dataset context for analysis'),
});

// Schema for what the LLM returns - using simple object instead of discriminated union
const identifyAssumptionsLLMOutputSchema = z.object({
  type: z.enum(['listAssumptions', 'noAssumptions']).describe('Type of result'),
  assumptions: z
    .array(
      z.object({
        descriptive_title: z.string().describe('A clear, descriptive title for the assumption'),
        classification: z
          .enum([
            'fieldMapping',
            'tableRelationship',
            'dataQuality',
            'dataFormat',
            'dataAvailability',
            'timePeriodInterpretation',
            'timePeriodGranularity',
            'metricInterpretation',
            'segmentInterpretation',
            'quantityInterpretation',
            'requestScope',
            'metricDefinition',
            'segmentDefinition',
            'businessLogic',
            'policyInterpretation',
            'optimization',
            'aggregation',
            'filtering',
            'sorting',
            'grouping',
            'calculationMethod',
            'dataRelevance',
            'valueScale',
            'joinSelection',
            'metricAmbiguity',
            'dataStaticAssumption',
            'uniqueIdentifier',
          ])
          .describe('The type/category of assumption made'),
        explanation: z
          .string()
          .describe('Detailed explanation of the assumption and its potential impact'),
        label: z
          .enum(['timeRelated', 'vagueRequest', 'major', 'minor'])
          .describe('Label indicating the nature and severity of the assumption'),
      })
    )
    .optional()
    .describe('List of assumptions (only if listAssumptions)'),
  message: z.string().optional().describe('Explanation message (only if noAssumptions)'),
});

// Result schema that includes the structured result
export const identifyAssumptionsResultSchema = z.object({
  toolCalled: z.string().describe('Type of result: listAssumptions or noAssumptions'),
  assumptions: z
    .array(
      z.object({
        descriptiveTitle: z.string().describe('A clear, descriptive title for the assumption'),
        classification: z
          .enum([
            'fieldMapping',
            'tableRelationship',
            'dataQuality',
            'dataFormat',
            'dataAvailability',
            'timePeriodInterpretation',
            'timePeriodGranularity',
            'metricInterpretation',
            'segmentInterpretation',
            'quantityInterpretation',
            'requestScope',
            'metricDefinition',
            'segmentDefinition',
            'businessLogic',
            'policyInterpretation',
            'optimization',
            'aggregation',
            'filtering',
            'sorting',
            'grouping',
            'calculationMethod',
            'dataRelevance',
            'valueScale',
            'joinSelection',
            'metricAmbiguity',
            'dataStaticAssumption',
            'uniqueIdentifier',
          ])
          .describe('The type/category of assumption made'),
        explanation: z
          .string()
          .describe('Detailed explanation of the assumption and its potential impact'),
        label: z
          .enum(['timeRelated', 'vagueRequest', 'major', 'minor'])
          .describe('Label indicating the nature and severity of the assumption'),
      })
    )
    .optional()
    .describe('List of assumptions identified'),
});

// Export types from schemas
export type IdentifyAssumptionsStepParams = z.infer<typeof identifyAssumptionsStepInputSchema>;
export type IdentifyAssumptionsStepResult = z.infer<typeof identifyAssumptionsResultSchema>;

const createDatasetSystemMessage = (datasets: string): string => {
  return `<dataset_context>
${datasets}
</dataset_context>`;
};

/**
 * Generate assumptions analysis using the LLM with structured output
 */
async function generateAssumptionsWithLLM(
  conversationHistory: ModelMessage[] | undefined,
  userName: string,
  datasets: string
): Promise<IdentifyAssumptionsStepResult> {
  try {
    // Prepare messages for the LLM
    const messages: ModelMessage[] = [];

    // Add dataset context as system message
    messages.push({
      role: 'system',
      content: createDatasetSystemMessage(datasets || 'No dataset context available.'),
    });

    // Add main system prompt
    messages.push({
      role: 'system',
      content: getIdentifyAssumptionsSystemMessage(),
    });

    // Add conversation history for analysis
    if (conversationHistory && conversationHistory.length > 0) {
      const chatHistoryText = JSON.stringify(conversationHistory, null, 2);
      messages.push({
        role: 'system',
        content: `Here is the chat history to analyze for assumptions:

User: ${userName}

Chat History:
\`\`\`
${chatHistoryText}
\`\`\``,
      });
    } else {
      messages.push({
        role: 'system',
        content: `User: ${userName}

No conversation history available for analysis.`,
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content:
        'Please analyze this conversation history and identify any assumptions that were made during the analysis.',
    });

    const tracedAssumptionsGeneration = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: await Sonnet4,
          schema: identifyAssumptionsLLMOutputSchema,
          messages,
          temperature: 0,
          maxOutputTokens: 10000,
        });
        return object;
      },
      {
        name: 'Identify Assumptions Analysis',
      }
    );

    const llmResult = await tracedAssumptionsGeneration();

    // Convert LLM result to output format
    if (llmResult.type === 'listAssumptions' && llmResult.assumptions) {
      // Convert snake_case from LLM to camelCase for result
      const assumptions = llmResult.assumptions.map((assumption) => ({
        descriptiveTitle: assumption.descriptive_title,
        classification: assumption.classification,
        explanation: assumption.explanation,
        label: assumption.label,
      }));

      return {
        toolCalled: 'listAssumptions',
        assumptions,
      };
    }

    return {
      toolCalled: 'noAssumptions',
      assumptions: undefined,
    };
  } catch (llmError) {
    console.warn('[IdentifyAssumptionsStep] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    // Return a default no assumptions result
    return {
      toolCalled: 'noAssumptions',
      assumptions: undefined,
    };
  }
}

export async function runIdentifyAssumptionsStep(
  params: IdentifyAssumptionsStepParams
): Promise<IdentifyAssumptionsStepResult> {
  try {
    const result = await generateAssumptionsWithLLM(
      params.conversationHistory,
      params.userName,
      params.datasets
    );

    return result;
  } catch (error) {
    console.error('[identify-assumptions-step] Unexpected error:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // For other errors, throw a user-friendly message
    throw new Error('Unable to analyze SQL queries for assumptions. Please try again later.');
  }
}
