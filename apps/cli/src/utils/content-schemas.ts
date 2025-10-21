import { z } from 'zod';

/**
 * Text content schema - plain text from assistant
 */
export const TextContentSchema = z.object({
  type: z.literal('text').describe('Content type discriminator'),
  text: z.string().describe('Text content'),
});

export type TextContent = z.infer<typeof TextContentSchema>;

/**
 * Reasoning content schema - internal model reasoning
 */
export const ReasoningContentSchema = z.object({
  type: z.literal('reasoning').describe('Content type discriminator'),
  text: z.string().describe('Reasoning text'),
});

export type ReasoningContent = z.infer<typeof ReasoningContentSchema>;

/**
 * Tool call content schema - represents a tool invocation
 */
export const ToolCallContentSchema = z.object({
  type: z.literal('tool-call').describe('Content type discriminator'),
  toolCallId: z.string().describe('Unique identifier for this tool call'),
  toolName: z.string().describe('Name of the tool being called'),
  input: z.unknown().describe('Tool input parameters'),
});

export type ToolCallContent = z.infer<typeof ToolCallContentSchema>;

/**
 * Tool result content schema - represents a tool execution result
 */
export const ToolResultContentSchema = z.object({
  type: z.literal('tool-result').describe('Content type discriminator'),
  toolCallId: z.string().describe('ID of the tool call this result corresponds to'),
  toolName: z.string().describe('Name of the tool that was executed'),
  output: z
    .object({
      type: z.literal('json').describe('Output format type'),
      value: z.string().describe('JSON-stringified output value'),
    })
    .describe('Tool execution output'),
});

export type ToolResultContent = z.infer<typeof ToolResultContentSchema>;

/**
 * Discriminated union of all content types
 */
export const MessageContentSchema = z.discriminatedUnion('type', [
  TextContentSchema,
  ReasoningContentSchema,
  ToolCallContentSchema,
  ToolResultContentSchema,
]);

export type MessageContent = z.infer<typeof MessageContentSchema>;
