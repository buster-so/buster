import { z } from 'zod';

// UUID validation schema
export const UUIDSchema = z.string().uuid('Must be a valid UUID');

// Simple input schema - just message_id
export const AnalystAgentTaskInputSchema = z.object({
  message_id: UUIDSchema,
  access_token: z.string().nullable(),
});

// Task execution result (for Trigger.dev monitoring)
export const TaskExecutionResultSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  executionTimeMs: z.number(),
  workflowCompleted: z.boolean(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
    })
    .optional(),
});

// Main output schema (Trigger.dev requires this for task definition)
export const AnalystAgentTaskOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  result: TaskExecutionResultSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
    })
    .optional(),
});

// Message context loaded from database
export const MessageContextSchema = z.object({
  message: z.object({
    id: z.string(),
    requestMessage: z.string().nullable(),
    chatId: z.string(),
    createdBy: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  chat: z.object({
    id: z.string(),
    title: z.string(),
    organizationId: z.string(),
    createdBy: z.string(),
  }),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
  }),
  organization: z.object({
    id: z.string(),
    name: z.string(),
  }),
  dataSource: z.object({
    id: z.string(),
    type: z.string(),
    organizationId: z.string(),
  }),
});

// Conversation history schema (from AI package)
export const ConversationMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.any(), // Can be string or complex types for tool messages
  id: z.string().optional(),
});

export const ConversationHistorySchema = z.array(ConversationMessageSchema);

// Inferred TypeScript types
export type AnalystAgentTaskInput = z.infer<typeof AnalystAgentTaskInputSchema>;
export type AnalystAgentTaskOutput = z.infer<typeof AnalystAgentTaskOutputSchema>;
export type TaskExecutionResult = z.infer<typeof TaskExecutionResultSchema>;
export type MessageContext = z.infer<typeof MessageContextSchema>;
export type ConversationHistory = z.infer<typeof ConversationHistorySchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
