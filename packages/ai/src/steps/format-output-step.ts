import { createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { z } from 'zod';
import {
  type MessageHistory,
  MessageHistorySchema,
  StepFinishDataSchema,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';
// Removed unused imports for parallel step schemas since we're using dynamic property access

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

// Type aliases for better type safety
type ThinkAndPrepOutput = z.infer<typeof ThinkAndPrepOutputSchema>;
type AnalystOutput = z.infer<typeof AnalystOutputSchema>;

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
  // Handle dynamic step names - workflow may pass data with any step name
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

// Type-safe extraction of step data
type StepData = ThinkAndPrepOutput | AnalystOutput;

const formatOutputExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof outputSchema>> => {
  // Determine which format we're receiving and extract the step data
  let stepData: StepData | undefined;

  if ('analyst' in inputData && inputData.analyst) {
    // Nested format with analyst step
    stepData = inputData.analyst as AnalystOutput;
  } else if ('think-and-prep' in inputData && inputData['think-and-prep']) {
    // Nested format with think-and-prep step only
    stepData = inputData['think-and-prep'] as ThinkAndPrepOutput;
  } else if (isValidStepData(inputData)) {
    // Direct format from either step - inputData is already the step output
    stepData = inputData as StepData;
  } else {
    // Try to find step data in any property (dynamic step names)
    const keys = Object.keys(inputData);
    for (const key of keys) {
      const value = (inputData as Record<string, unknown>)[key];
      if (isValidStepData(value)) {
        stepData = value as StepData;
        break;
      }
    }
  }

  if (!stepData) {
    throw new Error('Unrecognized input format for format-output-step');
  }

  // Helper function to safely extract CoreMessage array
  const getMessageArray = (messages: MessageHistory | undefined): CoreMessage[] => {
    if (!messages || !Array.isArray(messages)) {
      return [];
    }
    return messages;
  };

  // Get the parallel step results from the input data if available
  const parallelStepResults = {
    title: undefined as string | undefined,
    todos: undefined as string[] | undefined,
    values: undefined as string[] | undefined,
  };

  // Extract from nested format if available
  if ('generate-chat-title' in inputData && inputData['generate-chat-title']) {
    parallelStepResults.title = (inputData['generate-chat-title'] as any).title;
  }
  if ('create-todos' in inputData && inputData['create-todos']) {
    parallelStepResults.todos = (inputData['create-todos'] as any).todos;
  }
  if ('extract-values-search' in inputData && inputData['extract-values-search']) {
    parallelStepResults.values = (inputData['extract-values-search'] as any).values;
  }

  // Map the step data to the clean output format with type-safe extraction
  const output = {
    // Core conversation data
    conversationHistory: getMessageArray(stepData.conversationHistory),
    finished: stepData.finished ?? false,
    outputMessages: getMessageArray(stepData.outputMessages),
    stepData: stepData.stepData ?? undefined,
    metadata: stepData.metadata ?? undefined,

    // Additional fields from parallel steps or metadata
    title: parallelStepResults.title,
    todos: parallelStepResults.todos,
    values: parallelStepResults.values,
  };

  return output;
};

// Helper function to check if an object is valid step data
function isValidStepData(value: unknown): value is StepData {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  // Check for required properties that indicate this is step data
  return (
    ('outputMessages' in obj || 'conversationHistory' in obj) &&
    ('finished' in obj || 'stepData' in obj || 'metadata' in obj)
  );
}

export const formatOutputStep = createStep({
  id: 'format-output',
  description: 'Formats the workflow output to match the defined output schema',
  inputSchema,
  outputSchema,
  execute: formatOutputExecution,
});