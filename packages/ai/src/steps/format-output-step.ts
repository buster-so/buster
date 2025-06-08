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
  console.log('=== FORMAT OUTPUT STEP ===');
  console.log('Input data keys:', Object.keys(inputData));

  // Determine which format we're receiving and extract the step data
  let stepData: any;

  if ('analyst' in inputData && inputData.analyst) {
    // Nested format with analyst step
    stepData = inputData.analyst;
    console.log('Using analyst step data from nested structure');
  } else if ('think-and-prep' in inputData && inputData['think-and-prep']) {
    // Nested format with think-and-prep step only
    stepData = inputData['think-and-prep'];
    console.log('Using think-and-prep step data from nested structure');
  } else if ('conversationHistory' in inputData) {
    // Direct format - data is already in the expected structure
    stepData = inputData;
    console.log('Using direct step data structure');
  } else {
    throw new Error('Unrecognized input format for format-output-step');
  }

  console.log('Step data keys:', Object.keys(stepData));
  console.log('ConversationHistory length:', stepData.conversationHistory?.length || 0);

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

  console.log('Formatted output:', {
    conversationHistoryLength: output.conversationHistory?.length || 0,
    finished: output.finished,
    hasTitle: !!output.title,
    todoCount: output.todos?.length || 0,
    valueCount: output.values?.length || 0,
  });

  return output;
};

export const formatOutputStep = createStep({
  id: 'format-output',
  description: 'Formats the workflow output to match the defined output schema',
  inputSchema,
  outputSchema,
  execute: formatOutputExecution,
});
