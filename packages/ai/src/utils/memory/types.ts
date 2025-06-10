import type { CoreMessage } from 'ai';
import { z } from 'zod';

// Use CoreMessage[] directly from AI SDK as our internal format
// This eliminates type mismatches and works directly with agent.stream()
export type MessageHistory = CoreMessage[];

// Zod schema for validation - using z.any() since CoreMessage has complex union types
export const MessageHistorySchema = z.array(z.any());

// Step finish data structure
export const StepFinishDataSchema = z.object({
  stepType: z.string(),
  text: z.string().optional(),
  reasoning: z.string().optional(),
  reasoningDetails: z.array(z.any()).optional(),
  files: z.array(z.any()).optional(),
  sources: z.array(z.any()).optional(),
  toolCalls: z.array(
    z.object({
      type: z.literal('tool-call'),
      toolCallId: z.string(),
      toolName: z.string(),
      args: z.record(z.any()),
    })
  ),
  toolResults: z.array(z.any()).optional(),
  finishReason: z.string(),
  usage: z.any(),
  warnings: z.array(z.any()).optional(),
  logprobs: z.any().optional(),
  request: z.any(),
  response: z.object({
    id: z.string(),
    timestamp: z.any(),
    modelId: z.string(),
    headers: z.any(),
    messages: MessageHistorySchema,
  }),
  providerMetadata: z.any().optional(),
  experimental_providerMetadata: z.any().optional(),
  isContinued: z.boolean().optional(),
});

// Output schema for think-and-prep step
export const ThinkAndPrepOutputSchema = z.object({
  finished: z.boolean(),
  outputMessages: MessageHistorySchema,
  conversationHistory: MessageHistorySchema.optional(), // Include conversation history for workflow output
  stepData: StepFinishDataSchema.optional(), // The full step object
  metadata: z
    .object({
      toolsUsed: z.array(z.string()),
      finalTool: z.enum(['submitThoughts', 'respondWithoutAnalysis']).optional(),
      text: z.string().optional(),
      reasoning: z.string().optional(),
    })
    .optional(),
});

// Type exports
export type StepFinishData = z.infer<typeof StepFinishDataSchema>;
export type ThinkAndPrepOutput = z.infer<typeof ThinkAndPrepOutputSchema>;

// Type guards for CoreMessage from AI SDK
export function isAssistantMessage(message: CoreMessage): boolean {
  return message.role === 'assistant';
}

export function isToolMessage(message: CoreMessage): boolean {
  return message.role === 'tool';
}

export function hasToolCalls(message: CoreMessage): boolean {
  if (!isAssistantMessage(message)) return false;
  return (
    Array.isArray(message.content) &&
    message.content.some(
      (item) => typeof item === 'object' && 'type' in item && item.type === 'tool-call'
    )
  );
}
