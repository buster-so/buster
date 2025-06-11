import { z } from 'zod';

// Text content schema
const TextContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

// Image content schema
const ImageContentSchema = z.object({
  type: z.literal('image'),
  image: z.union([
    z.string(), // URL
    z.instanceof(Uint8Array), // Binary data
    z.instanceof(ArrayBuffer),
    z.instanceof(Buffer),
    z.object({
      url: z.string(),
    }),
    z.object({
      data: z.string(),
      mimeType: z.string().optional(),
    }),
  ]),
  mimeType: z.string().optional(),
});

// Tool call content schema
const ToolCallContentSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.record(z.unknown()), // Tool args can vary, but we know it's a record
});

// Tool result content schema
const ToolResultContentSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  result: z.unknown(), // Tool results can vary
  isError: z.boolean().optional(),
});

// Union of all content types
const MessageContentSchema = z.union([
  TextContentSchema,
  ImageContentSchema,
  ToolCallContentSchema,
  ToolResultContentSchema,
]);

// Provider metadata schemas
const OpenAIProviderMetadataSchema = z.object({
  openai: z
    .object({
      reasoningContent: z.string().optional(),
      cacheControl: z
        .object({
          type: z.enum(['ephemeral']),
        })
        .optional(),
    })
    .optional(),
});

const AnthropicProviderMetadataSchema = z.object({
  anthropic: z
    .object({
      cacheControl: z
        .object({
          type: z.enum(['ephemeral']),
        })
        .optional(),
    })
    .optional(),
});

const ProviderMetadataSchema = z.union([
  OpenAIProviderMetadataSchema,
  AnthropicProviderMetadataSchema,
  z.object({}), // Empty object for no metadata
]);

// Core message schemas for each role
const SystemMessageSchema = z.object({
  role: z.literal('system'),
  content: z.string(),
  experimental_providerMetadata: ProviderMetadataSchema.optional(),
});

const UserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.union([z.string(), z.array(MessageContentSchema)]),
  experimental_providerMetadata: ProviderMetadataSchema.optional(),
});

const AssistantMessageSchema = z.object({
  role: z.literal('assistant'),
  content: z.union([z.string(), z.array(MessageContentSchema)]),
  experimental_providerMetadata: ProviderMetadataSchema.optional(),
});

const ToolMessageSchema = z.object({
  role: z.literal('tool'),
  content: z.array(ToolResultContentSchema),
  experimental_providerMetadata: ProviderMetadataSchema.optional(),
});

// Main CoreMessage schema
export const CoreMessageSchema = z.union([
  SystemMessageSchema,
  UserMessageSchema,
  AssistantMessageSchema,
  ToolMessageSchema,
]);

// Array of messages
export const CoreMessagesSchema = z.array(CoreMessageSchema);

// Type exports
export type CoreMessageZod = z.infer<typeof CoreMessageSchema>;
export type CoreMessagesZod = z.infer<typeof CoreMessagesSchema>;

// Type guards
export function isAssistantMessage(
  message: CoreMessageZod
): message is z.infer<typeof AssistantMessageSchema> {
  return message.role === 'assistant';
}

export function isToolMessage(
  message: CoreMessageZod
): message is z.infer<typeof ToolMessageSchema> {
  return message.role === 'tool';
}

export function hasToolCalls(message: CoreMessageZod): boolean {
  if (!isAssistantMessage(message)) return false;
  return (
    Array.isArray(message.content) && message.content.some((item) => item.type === 'tool-call')
  );
}
