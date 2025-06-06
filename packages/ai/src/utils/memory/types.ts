import type { CoreAssistantMessage, CoreMessage, CoreToolMessage } from 'ai';
import { z } from 'zod';

// Tool call schema matching the actual structure from Mastra
export const ToolCallSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.record(z.any()),
});

// Tool result schema
export const ToolResultSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  result: z.any(),
});

// Content item schemas
export const TextContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const ContentItemSchema = z.union([TextContentSchema, ToolCallSchema, ToolResultSchema]);

// Core message schemas matching AI SDK format
export const CoreAssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: z.array(ContentItemSchema),
  id: z.string(),
});

export const CoreToolMessageSchema = z.object({
  role: z.literal('tool'),
  content: z.array(ToolResultSchema),
  id: z.string(),
});

export const CoreUserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.string(),
});

export const CoreSystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.string(),
});

// Union of all message types
export const CoreMessageSchema = z.union([
  CoreAssistantMessageSchema,
  CoreToolMessageSchema,
  CoreUserMessageSchema,
  CoreSystemMessageSchema,
]);

// Array of messages (what we get from step.response.messages)
export const MessageHistorySchema = z.array(CoreMessageSchema);

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
  stepData: StepFinishDataSchema.optional(), // The full step object
  metadata: z
    .object({
      toolsUsed: z.array(z.string()),
      finalTool: z.enum(['submitThoughtsTool', 'finishAndRespondTool']).optional(),
      text: z.string().optional(),
      reasoning: z.string().optional(),
    })
    .optional(),
});

// Type exports
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type ToolResult = z.infer<typeof ToolResultSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;
export type MessageHistory = z.infer<typeof MessageHistorySchema>;
export type StepFinishData = z.infer<typeof StepFinishDataSchema>;
export type ThinkAndPrepOutput = z.infer<typeof ThinkAndPrepOutputSchema>;

// Type guards
export function isAssistantMessage(message: CoreMessage): message is CoreAssistantMessage {
  return message.role === 'assistant';
}

export function isToolMessage(message: CoreMessage): message is CoreToolMessage {
  return message.role === 'tool';
}

export function hasToolCalls(message: CoreMessage): boolean {
  if (!isAssistantMessage(message)) return false;
  return (
    Array.isArray(message.content) &&
    message.content.some((item) => typeof item === 'object' && item.type === 'tool-call')
  );
}
