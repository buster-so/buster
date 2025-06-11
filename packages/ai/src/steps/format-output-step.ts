import { createStep } from '@mastra/core';
import type { CoreMessage } from 'ai';
import { z } from 'zod';
import {
  type MessageHistory,
  MessageHistorySchema,
  StepFinishDataSchema,
  ReasoningHistorySchema,
  ResponseHistorySchema,
} from '../utils/memory/types';

// The analyst step output schema
const AnalystOutputSchema = z.object({
  conversationHistory: MessageHistorySchema,
  finished: z.boolean().optional(),
  outputMessages: MessageHistorySchema.optional(),
  stepData: StepFinishDataSchema.optional(),
  reasoningHistory: ReasoningHistorySchema, // Add reasoning history
  responseHistory: ResponseHistorySchema, // Add response history
  metadata: z
    .object({
      toolsUsed: z.array(z.string()).optional(),
      finalTool: z.string().optional(),
      doneTool: z.boolean().optional(),
    })
    .optional(),
});

// Input now always comes from analyst step
const inputSchema = AnalystOutputSchema;

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
  reasoningHistory: ReasoningHistorySchema, // Add reasoning history
  responseHistory: ResponseHistorySchema, // Add response history
  metadata: WorkflowMetadataSchema.optional(),
});

const formatOutputExecution = async ({
  inputData,
}: {
  inputData: z.infer<typeof inputSchema>;
}): Promise<z.infer<typeof outputSchema>> => {
  // Helper function to safely extract CoreMessage array
  const getMessageArray = (messages: MessageHistory | undefined): CoreMessage[] => {
    if (!messages || !Array.isArray(messages)) {
      return [];
    }
    return messages;
  };

  // Simply map the analyst output to the workflow output format
  const output = {
    // Core conversation data
    conversationHistory: getMessageArray(inputData.conversationHistory),
    finished: inputData.finished ?? false,
    outputMessages: getMessageArray(inputData.outputMessages),
    stepData: inputData.stepData ?? undefined,
    reasoningHistory: inputData.reasoningHistory || [],
    responseHistory: inputData.responseHistory || [],
    metadata: inputData.metadata ?? undefined,

    // These fields would come from parallel steps in a more complex implementation
    // For now, they're always undefined as they're not passed through the analyst step
    title: undefined,
    todos: undefined,
    values: undefined,
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
