import { z } from 'zod';

/**
 * Slack Block Kit types and schemas
 */

// Text object schemas
export const SlackTextObjectSchema = z.object({
  type: z.enum(['plain_text', 'mrkdwn']),
  text: z.string(),
  emoji: z.boolean().optional(),
  verbatim: z.boolean().optional(),
});

// Block element schemas
export const SlackButtonElementSchema = z.object({
  type: z.literal('button'),
  action_id: z.string().optional(),
  text: z.object({
    type: z.literal('plain_text'),
    text: z.string(),
    emoji: z.boolean().optional(),
  }),
  value: z.string().optional(),
  url: z.string().optional(),
  style: z.enum(['primary', 'danger']).optional(),
});

// Static select element
export const SlackStaticSelectElementSchema = z.object({
  type: z.literal('static_select'),
  action_id: z.string().optional(),
  placeholder: z
    .object({
      type: z.literal('plain_text'),
      text: z.string(),
      emoji: z.boolean().optional(),
    })
    .optional(),
  options: z
    .array(
      z.object({
        text: z.object({
          type: z.literal('plain_text'),
          text: z.string(),
          emoji: z.boolean().optional(),
        }),
        value: z.string(),
      })
    )
    .optional(),
  initial_option: z
    .object({
      text: z.object({
        type: z.literal('plain_text'),
        text: z.string(),
        emoji: z.boolean().optional(),
      }),
      value: z.string(),
    })
    .optional(),
});

export const SlackBlockElementSchema = z.union([
  SlackButtonElementSchema,
  SlackStaticSelectElementSchema,
]);

// Block schemas
export const SlackSectionBlockSchema = z.object({
  type: z.literal('section'),
  block_id: z.string().optional(),
  text: SlackTextObjectSchema.optional(),
  fields: z.array(SlackTextObjectSchema).optional(),
  accessory: SlackBlockElementSchema.optional(),
});

export const SlackActionsBlockSchema = z.object({
  type: z.literal('actions'),
  block_id: z.string().optional(),
  elements: z.array(SlackBlockElementSchema),
});

export const SlackContextBlockSchema = z.object({
  type: z.literal('context'),
  block_id: z.string().optional(),
  elements: z.array(
    z.union([
      SlackTextObjectSchema,
      z.object({
        type: z.literal('image'),
        image_url: z.string(),
        alt_text: z.string(),
      }),
    ])
  ),
});

export const SlackDividerBlockSchema = z.object({
  type: z.literal('divider'),
  block_id: z.string().optional(),
});

// Union of all block types
export const SlackBlockSchema = z.union([
  SlackSectionBlockSchema,
  SlackActionsBlockSchema,
  SlackContextBlockSchema,
  SlackDividerBlockSchema,
]);

// Attachment schema
export const SlackAttachmentSchema = z.object({
  color: z.string().optional(),
  fallback: z.string().optional(),
  text: z.string().optional(),
  pretext: z.string().optional(),
  title: z.string().optional(),
  title_link: z.string().optional(),
  fields: z
    .array(
      z.object({
        title: z.string(),
        value: z.string(),
        short: z.boolean().optional(),
      })
    )
    .optional(),
  ts: z.number().optional(),
});

// Type exports
export type SlackTextObject = z.infer<typeof SlackTextObjectSchema>;
export type SlackButtonElement = z.infer<typeof SlackButtonElementSchema>;
export type SlackBlockElement = z.infer<typeof SlackBlockElementSchema>;
export type SlackSectionBlock = z.infer<typeof SlackSectionBlockSchema>;
export type SlackActionsBlock = z.infer<typeof SlackActionsBlockSchema>;
export type SlackContextBlock = z.infer<typeof SlackContextBlockSchema>;
export type SlackDividerBlock = z.infer<typeof SlackDividerBlockSchema>;
export type SlackBlock = z.infer<typeof SlackBlockSchema>;
export type SlackAttachment = z.infer<typeof SlackAttachmentSchema>;
