import { createStep } from '@mastra/core';
import { z } from 'zod';
import { ThinkAndPrepOutputSchema } from '../utils/memory/types';

// Input comes from workflow - either from think-and-prep or analyst step
const inputSchema = z.union([
  // Direct output from think-and-prep step (when analyst step is skipped)
  ThinkAndPrepOutputSchema,
  // Direct output from analyst step
  z.object({
    conversationHistory: z.array(z.any()),
    finished: z.boolean().optional(),
    outputMessages: z.array(z.any()).optional(),
    stepData: z.any().optional(),
    metadata: z.any().optional(),
  }),
  // Nested structure from workflow (step name as key) - for complex branching scenarios
  z.object({
    'think-and-prep': ThinkAndPrepOutputSchema.optional(),
    analyst: z
      .object({
        conversationHistory: z.array(z.any()),
        finished: z.boolean().optional(),
        outputMessages: z.array(z.any()).optional(),
        stepData: z.any().optional(),
        metadata: z.any().optional(),
      })
      .optional(),
  }),
  // Handle Mastra workflow branching output format - when branch doesn't execute
  z.object({
    'think-and-prep': ThinkAndPrepOutputSchema,
  }),
  // Handle any other potential workflow structures - fallback for debugging
  z.record(z.any()),
]);

// Clean output schema matching the workflow output schema
const outputSchema = z.object({
  title: z.string().optional(),
  todos: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  conversationHistory: z.array(z.any()).optional(),
  finished: z.boolean().optional(),
  outputMessages: z.array(z.any()).optional(),
  stepData: z.any().optional(),
  metadata: z.any().optional(),
});

const formatOutputExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof outputSchema>> => {
  // Determine which format we're receiving and extract the step data
  let stepData: any;

  if ('analyst' in inputData && inputData.analyst) {
    // Nested format with analyst step
    stepData = inputData.analyst;
  } else if ('think-and-prep' in inputData && inputData['think-and-prep']) {
    // Nested format with think-and-prep step only
    stepData = inputData['think-and-prep'];
  } else if ('outputMessages' in inputData && 'finished' in inputData) {
    // Direct format from think-and-prep step or analyst step
    stepData = inputData;
  } else if ('conversationHistory' in inputData) {
    // Direct format from analyst step
    stepData = inputData;
  } else {
    // Try to find any step data in the input structure
    const inputKeys = Object.keys(inputData);

    // Look for step data in any key that looks like step output
    for (const key of inputKeys) {
      const value = (inputData as any)[key];
      if (
        value &&
        typeof value === 'object' &&
        ('outputMessages' in value || 'conversationHistory' in value || 'finished' in value)
      ) {
        stepData = value;
        break;
      }
    }

    if (!stepData) {
      // Enhanced error logging for debugging
      console.error('Unrecognized input format for format-output-step:', {
        inputKeys: Object.keys(inputData),
        inputData: JSON.stringify(inputData, null, 2),
      });
      throw new Error('Unrecognized input format for format-output-step');
    }
  }

  // Map the step data to the clean output format with safety checks
  const output = {
    // Core conversation data - with fallback defaults
    conversationHistory: stepData.conversationHistory || [],
    finished: stepData.finished ?? false,
    outputMessages: stepData.outputMessages || [],
    stepData: stepData.stepData || null,
    metadata: stepData.metadata || null,

    // Additional fields from metadata if available
    title: stepData.metadata?.title || undefined,
    todos: stepData.metadata?.todos || undefined,
    values: stepData.metadata?.values || undefined,
  };

  return output;
};

export const formatOutputStep = createStep({
  id: 'format-output',
  description: 'Formats the workflow output to match the defined output schema',
  inputSchema,
  outputSchema,
  execute: formatOutputExecution,
});
