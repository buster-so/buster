import type { CoreMessage } from 'ai';
import { z } from 'zod';

// Use CoreMessage[] directly from AI SDK as our internal format
// This eliminates type mismatches and works directly with agent.stream()
export type MessageHistory = CoreMessage[];

// Zod schema for validation - using passthrough to preserve the original type
// This validates the structure without changing the type
export const MessageHistorySchema = z.custom<CoreMessage[]>((val) => Array.isArray(val), {
  message: 'Must be an array of messages',
});

// Schemas for message types
const BusterChatResponseMessageTextSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  message: z.string(),
  message_chunk: z.string().optional(),
  is_final_message: z.boolean(),
});

const BusterChatResponseMessageFileSchema = z.object({
  id: z.string(),
  type: z.literal('file'),
  file_type: z.enum(['metric', 'dashboard']),
  file_name: z.string(),
  version_number: z.number(),
  filter_version_id: z.string().nullable(),
  metadata: z.array(z.object({
    status: z.string(),
    message: z.string(),
    timestamp: z.number().optional(),
  })).optional(),
});

const BusterChatMessageReasoningTextSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  title: z.string(),
  secondary_title: z.string().optional(),
  message: z.string().optional(),
  message_chunk: z.string().optional(),
  status: z.enum(['loading', 'completed', 'failed']),
  finished_reasoning: z.boolean().optional(),
});

const BusterChatMessageReasoningPillSchema = z.object({
  id: z.string(),
  type: z.literal('pills'),
  title: z.string(),
  secondary_title: z.string().optional(),
  pill_containers: z.array(z.object({
    title: z.string(),
    pills: z.array(z.object({
      text: z.string(),
      type: z.string().nullable(),
      id: z.string(),
    })),
  })),
  status: z.enum(['loading', 'completed', 'failed']),
});

const BusterChatMessageReasoningFileSchema = z.object({
  id: z.string(),
  file_type: z.enum(['metric', 'dashboard']),
  file_name: z.string(),
  version_number: z.number(),
  status: z.enum(['loading', 'completed', 'failed']),
  file: z.object({
    text: z.string().optional(),
    text_chunk: z.string().optional(),
    modified: z.array(z.tuple([z.number(), z.number()])).optional(),
  }),
});

const BusterChatMessageReasoningFilesSchema = z.object({
  id: z.string(),
  type: z.literal('files'),
  title: z.string(),
  status: z.enum(['loading', 'completed', 'failed']),
  secondary_title: z.string().optional(),
  file_ids: z.array(z.string()),
  files: z.record(BusterChatMessageReasoningFileSchema),
});

// Union schemas
export const BusterChatMessageResponseSchema = z.union([
  BusterChatResponseMessageTextSchema,
  BusterChatResponseMessageFileSchema,
]);

export const BusterChatMessageReasoningSchema = z.union([
  BusterChatMessageReasoningTextSchema,
  BusterChatMessageReasoningPillSchema,
  BusterChatMessageReasoningFilesSchema,
]);

// Schema for reasoning and response message histories
export const ReasoningHistorySchema = z.array(BusterChatMessageReasoningSchema).optional();
export const ResponseHistorySchema = z.array(BusterChatMessageResponseSchema).optional();

// Schema for reasoning details
const ReasoningDetailSchema = z.object({
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
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
  result: z.string().or(z.object({})), // Tool-specific results as string or object
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
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
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
      args: z.record(z.string(), z.string().or(z.number()).or(z.boolean()).or(z.array(z.string()))), // Tool args vary by tool
    })
  ),
  toolResults: z.array(ToolResultSchema).optional(),
  finishReason: z.string(),
  usage: UsageSchema,
  warnings: z.array(WarningSchema).optional(),
  logprobs: z.object({}).optional(), // Model-specific logprobs format
  request: RequestMetadataSchema,
  response: z.object({
    id: z.string(),
    timestamp: z.date().or(z.string()), // Can be Date or ISO string
    modelId: z.string(),
    headers: ResponseHeadersSchema,
    messages: MessageHistorySchema,
  }),
  providerMetadata: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
  experimental_providerMetadata: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
  isContinued: z.boolean().optional(),
});

// Output schema for think-and-prep step
export const ThinkAndPrepOutputSchema = z.object({
  finished: z.boolean(),
  outputMessages: MessageHistorySchema,
  conversationHistory: MessageHistorySchema.optional(), // Include conversation history for workflow output
  stepData: StepFinishDataSchema.optional(), // The full step object
  reasoningHistory: ReasoningHistorySchema, // Add reasoning history
  responseHistory: ResponseHistorySchema, // Add response history
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
