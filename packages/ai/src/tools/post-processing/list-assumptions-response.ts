import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

// Core interfaces for List Assumptions Response
interface ListAssumptionsOutput {
  success: boolean;
}

// Zod schema for assumption item
export const assumptionItemSchema = z.object({
  descriptive_title: z.string().describe('Clear title summarizing the assumption'),
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
    ])
    .describe('The classification type of the assumption'),
  explanation: z
    .string()
    .describe(
      'Detailed explanation of the assumption, including query context, documentation gaps, potential issues, contributing factors, and justification for the assigned label (timeRelated, vagueRequest, major, or minor)'
    ),
  label: z
    .enum(['timeRelated', 'vagueRequest', 'major', 'minor'])
    .describe(
      "The label assigned to the assumption: 'timeRelated' for time-related assumptions, 'vagueRequest' for assumptions due to vague user requests, 'major' for critical assumptions, or 'minor' for less impactful assumptions"
    ),
});

// Zod schema for list assumptions input validation
export const listAssumptionsSchema = z.object({
  assumptions: z
    .array(assumptionItemSchema)
    .describe('List of assumptions identified based on metric SQL queries.'),
});

// List Assumptions Response Tool
export const listAssumptionsResponse = createTool({
  id: 'listAssumptionsResponse',
  description: 'Use to list all assumptions found in the SQL query',
  inputSchema: listAssumptionsSchema,
  outputSchema: z.object({
    success: z.boolean().describe('Whether the assumptions were processed successfully'),
  }),
  execute: async ({ context }) => {
    return await processListAssumptions(context as z.infer<typeof listAssumptionsSchema>);
  },
});

const processListAssumptions = wrapTraced(
  async (params: z.infer<typeof listAssumptionsSchema>): Promise<ListAssumptionsOutput> => {
    try {
      // Validate that we have assumptions to process
      if (!params.assumptions || params.assumptions.length === 0) {
        throw new Error('No assumptions provided to process');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in list assumptions response:', error);

      // Provide helpful error messages
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid list assumptions parameters: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }

      throw new Error(
        `List assumptions processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
  { name: 'listAssumptionsResponse' }
);
