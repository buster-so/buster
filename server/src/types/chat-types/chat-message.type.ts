import { z } from 'zod';

// Message role for chat messages
export const MessageRoleSchema = z.enum(['user', 'assistant']);

// Chat user message schema
export const ChatUserMessageSchema = z.object({
  request: z.string(),
  sender_id: z.string(),
  sender_name: z.string(),
  sender_avatar: z.string().optional(),
});

const StatusSchema = z.enum(['loading', 'completed', 'failed']);

const ResponseMessage_TextSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  message: z.string(),
});

const ResponseMessage_FileSchema = z.object({
  id: z.string(),
  type: z.literal('file'),
  file_type: z.enum(['metric', 'dashboard', 'reasoning']),
  file_name: z.string(),
  version_number: z.number(),
  filter_version_id: z.string().nullable(),
  metadata: z.array(
    z.object({
      status: StatusSchema,
      message: z.string(),
      timestamp: z.number().optional(),
    })
  ),
});

export const ResponseMessageSchema = z.discriminatedUnion('type', [
  ResponseMessage_TextSchema,
  ResponseMessage_FileSchema,
]);

const ReasoningMessage_TextSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  title: z.string(),
  secondary_title: z.string().optional(),
  message: z.string().optional(),
  message_chunk: z.string().optional(),
  status: StatusSchema,
  finished_reasoning: z.boolean().optional(),
});

const ReasoningFileTypeSchema = z.enum(['metric', 'dashboard', 'reasoning', 'agent-action']);

const ReasoningFileSchema = z.object({
  id: z.string(),
  file_type: ReasoningFileTypeSchema,
  file_name: z.string(),
  version_number: z.number(),
  status: StatusSchema,
  file: z.object({
    text: z.string().optional(),
    modified: z.array(z.tuple([z.number(), z.number()])).optional(),
  }),
});

const ReasoningMessage_FilesSchema = z.object({
  id: z.string(),
  type: z.literal('files'),
  title: z.string(),
  status: StatusSchema,
  secondary_title: z.string().optional(),
  file_ids: z.array(z.string()),
  files: z.record(z.string(), ReasoningFileSchema),
});

const ReasoingMessage_ThoughtFileTypeSchema = z.enum([
  'metric',
  'dashboard',
  'collection',
  'dataset',
  'term',
  'topic',
  'value',
  'empty',
]);

const ReasoningMessage_PillSchema = z.object({
  text: z.string(),
  type: ReasoingMessage_ThoughtFileTypeSchema,
  id: z.string(),
});

const ReasoningMessage_PillContainerSchema = z.object({
  title: z.string(),
  pills: z.array(ReasoningMessage_PillSchema),
});

const ReasoningMessage_PillsSchema = z.object({
  id: z.string(),
  type: z.literal('pills'),
  title: z.string(),
  secondary_title: z.string().optional(),
  pill_containers: z.array(ReasoningMessage_PillContainerSchema),
  status: StatusSchema,
});

export const ReasoningMessageSchema = z.discriminatedUnion('type', [
  ReasoningMessage_TextSchema,
  ReasoningMessage_FilesSchema,
  ReasoningMessage_PillsSchema,
]);

// Chat message schema
export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  request_message: ChatUserMessageSchema,
  response_messages: z.record(z.string(), ResponseMessageSchema),
  response_message_ids: z.array(z.string()),
  reasoning_message_ids: z.array(z.string()),
  reasoning_messages: z.record(z.string(), ReasoningMessageSchema),
  created_at: z.string(),
  updated_at: z.string(),
  final_reasoning_message: z.string().nullable(),
  feedback: z.enum(['negative']).nullable(),
  is_completed: z.boolean(),
});

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type ChatUserMessage = z.infer<typeof ChatUserMessageSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatMessageReasoning_status = z.infer<typeof StatusSchema>;
export type ChatMessageResponseMessage = z.infer<typeof ResponseMessageSchema>;
export type ChatMessageReasoningMessage = z.infer<typeof ReasoningMessageSchema>;
