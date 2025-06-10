import type { CoreMessage } from 'ai';
import { z } from 'zod';

// Use CoreMessage[] directly from AI SDK as our internal format
// This eliminates type mismatches and works directly with agent.stream()
export type MessageHistory = CoreMessage[];

// Zod schema for validation - using passthrough to preserve the original type
// This validates the structure without changing the type
export const MessageHistorySchema = z.custom<CoreMessage[]>(
  (val) => Array.isArray(val),
  { message: 'Must be an array of messages' }
);

// Schema for reasoning details
const ReasoningDetailSchema = z.object({
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

// Schema for file metadata
const FileMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number().optional(),
  url: z.string().optional(),
});

// Schema for source references
const SourceReferenceSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  reference: z.string().optional(),
});

// Schema for tool results
const ToolResultSchema = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  result: z.unknown(), // Tool-specific results
});

// Schema for usage information
const UsageSchema = z.object({
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
});

// Schema for warnings
const WarningSchema = z.object({
  type: z.string(),
  message: z.string(),
});

// Schema for request metadata
const RequestMetadataSchema = z.object({
  model: z.string(),
  messages: MessageHistorySchema,
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })).optional(),
});

// Schema for response headers
const ResponseHeadersSchema = z.record(z.string());

// Step finish data structure
export const StepFinishDataSchema = z.object({
  stepType: z.string(),
  text: z.string().optional(),
  reasoning: z.string().optional(),
  reasoningDetails: z.array(ReasoningDetailSchema).optional(),
  files: z.array(FileMetadataSchema).optional(),
  sources: z.array(SourceReferenceSchema).optional(),
  toolCalls: z.array(
    z.object({
      type: z.literal('tool-call'),
      toolCallId: z.string(),
      toolName: z.string(),
      args: z.record(z.unknown()), // Tool args vary by tool
    })
  ),
  toolResults: z.array(ToolResultSchema).optional(),
  finishReason: z.string(),
  usage: UsageSchema,
  warnings: z.array(WarningSchema).optional(),
  logprobs: z.unknown().optional(), // Model-specific logprobs format
  request: RequestMetadataSchema,
  response: z.object({
    id: z.string(),
    timestamp: z.date().or(z.string()), // Can be Date or ISO string
    modelId: z.string(),
    headers: ResponseHeadersSchema,
    messages: MessageHistorySchema,
  }),
  providerMetadata: z.record(z.unknown()).optional(),
  experimental_providerMetadata: z.record(z.unknown()).optional(),
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
