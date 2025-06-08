import { createStep } from '@mastra/core';
import { z } from 'zod';
import { ThinkAndPrepOutputSchema } from '../utils/memory/types';

// Input comes from workflow - either from think-and-prep or analyst step
const inputSchema = z.union([
  // Direct output from think-and-prep or analyst step
  ThinkAndPrepOutputSchema,
  z.object({
    conversationHistory: z.array(z.any()),
    finished: z.boolean().optional(),
    outputMessages: z.array(z.any()).optional(),
    stepData: z.any().optional(),
    metadata: z.any().optional(),
  }),
  // Nested structure from workflow (step name as key)
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
  } else if ('conversationHistory' in inputData) {
    // Direct format - data is already in the expected structure
    stepData = inputData;
  } else {
    throw new Error('Unrecognized input format for format-output-step');
  }


  // Map the step data to the clean output format
  const output = {
    // Core conversation data - always available
    conversationHistory: stepData.conversationHistory,
    finished: stepData.finished,
    outputMessages: stepData.outputMessages,
    stepData: stepData.stepData,
    metadata: stepData.metadata,

    // Additional fields from metadata if available
    title: stepData.metadata?.title,
    todos: stepData.metadata?.todos,
    values: stepData.metadata?.values,
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
