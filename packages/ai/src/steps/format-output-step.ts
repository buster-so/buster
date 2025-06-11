import { createStep } from '@mastra/core';
import { z } from 'zod';
import {
  MessageHistorySchema,
  StepFinishDataSchema,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';

// Define the analyst output schema inline to avoid circular dependencies
const AnalystOutputSchema = z.object({
  conversationHistory: MessageHistorySchema,
  finished: z.boolean().optional(),
  outputMessages: MessageHistorySchema.optional(),
  stepData: StepFinishDataSchema.optional(),
  metadata: z
    .object({
      toolsUsed: z.array(z.string()).optional(),
      finalTool: z.string().optional(),
      doneTool: z.boolean().optional(),
    })
    .optional(),
});

// Input comes from workflow - either from think-and-prep or analyst step
const inputSchema = z.union([
  // Direct output from think-and-prep step (when analyst step is skipped)
  ThinkAndPrepOutputSchema,
  // Direct output from analyst step
  AnalystOutputSchema,
  // Nested structure from workflow (step name as key) - for complex branching scenarios
  z.object({
    'think-and-prep': ThinkAndPrepOutputSchema.optional(),
    analyst: AnalystOutputSchema.optional(),
  }),
  // Handle Mastra workflow branching output format - when branch doesn't execute
  z.object({
    'think-and-prep': ThinkAndPrepOutputSchema,
  }),
  // Handle case where Mastra passes the previous step's output directly after a skipped branch
  // This is a more permissive schema that captures the essential properties
  z.object({
    outputMessages: MessageHistorySchema.optional(),
    conversationHistory: MessageHistorySchema.optional(),
    finished: z.boolean().optional(),
    stepData: StepFinishDataSchema.optional(),
    metadata: z.record(z.unknown()).optional(),
  }).passthrough(), // Allow additional properties from think-and-prep or analyst steps
  // Handle any other potential workflow structures - fallback for debugging
  z.record(z.unknown()),
]);

// Metadata schema for workflow output
const WorkflowMetadataSchema = z.object({
  toolsUsed: z.array(z.string()).optional(),
  finalTool: z.string().optional(),
  text: z.string().optional(),
  reasoning: z.string().optional(),
});

// Clean output schema matching the workflow output schema
const outputSchema = z.object({
  title: z.string().optional(),
  todos: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  conversationHistory: MessageHistorySchema.optional(),
  finished: z.boolean().optional(),
  outputMessages: MessageHistorySchema.optional(),
  stepData: StepFinishDataSchema.optional(),
  metadata: WorkflowMetadataSchema.optional(),
});

const formatOutputExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof outputSchema>> => {
  // Determine which format we're receiving and extract the step data
  let stepData: {
    conversationHistory?: unknown;
    finished?: boolean;
    outputMessages?: unknown;
    stepData?: unknown;
    metadata?: {
      title?: string;
      todos?: string[];
      values?: string[];
      toolsUsed?: string[];
      finalTool?: string;
      text?: string;
      reasoning?: string;
    };
  };

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
      const value = (inputData as Record<string, unknown>)[key];
      if (
        value &&
        typeof value === 'object' &&
        ('outputMessages' in value || 'conversationHistory' in value || 'finished' in value)
      ) {
        stepData = value;
        break;
      }
    }

    // If still no stepData found, check if the entire inputData itself is the step output
    // This can happen when Mastra passes data directly from a previous step after a skipped branch
    if (!stepData) {
      // Log the structure for debugging
      console.warn('Format-output-step received unexpected input structure:', {
        keys: Object.keys(inputData),
        hasOutputMessages: 'outputMessages' in inputData,
        hasConversationHistory: 'conversationHistory' in inputData,
        hasFinished: 'finished' in inputData,
        inputDataType: typeof inputData,
      });
      
      // Check if the inputData itself has the expected step output properties
      // This is stricter validation to ensure we only accept valid step data
      const hasValidStepProperties = 
        ('outputMessages' in inputData || 'conversationHistory' in inputData) ||
        ('finished' in inputData && typeof (inputData as any).finished === 'boolean') ||
        ('stepData' in inputData) ||
        ('metadata' in inputData);
      
      if (
        typeof inputData === 'object' &&
        inputData !== null &&
        hasValidStepProperties
      ) {
        stepData = inputData as any;
      } else {
        throw new Error('Unrecognized input format for format-output-step');
      }
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
