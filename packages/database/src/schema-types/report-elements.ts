import { z } from 'zod';

/**
 * Common Attributes
 * -----------------
 * Shared optional attributes for alignment and other element-specific settings.
 */
const AttributesSchema = z.object({
  id: z.string().optional(),
  indent: z.number().int().min(0).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  lineHeight: z.number().optional(),
  subscript: z.boolean().optional(),
  superscript: z.boolean().optional(),
  attributes: z
    .object({
      align: z.enum(['left', 'center', 'right']).optional(), //yes in both places
    })
    .optional(),
});

/**
 * Inline Text Schemas
 * -------------------
 * Schemas for text nodes with various formatting options.
 */

// Basic text node with formatting flags
export const TextSchema = z
  .object({
    text: z.string(),
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    highlight: z.boolean().optional(),
    kbd: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    code: z.boolean().optional(),
    fontSize: z
      .string()
      .regex(/^(?:\d+px)$/)
      .optional(),
  })
  .merge(AttributesSchema);

// Simplified text node (plain text without formatting)
export const SimpleTextSchema = z
  .object({
    text: z.string(),
  })
  .merge(AttributesSchema);

export const VoidTextSchema = z.object({
  text: z.literal(''),
});

/**
 * Inline Elements
 * ---------------
 * Schemas for inlines like mentions and links.
 */

// Mention element, e.g., @user or similar references
export const MentionSchema = z.object({
  type: z.literal('mention'),
  value: z.string(),
  children: z.array(TextSchema),
  key: z.string().optional(),
});

// Anchor (link) element containing text or mentions
export const AnchorSchema = z.object({
  type: z.literal('a'),
  url: z.string(),
  children: z.array(z.union([TextSchema, MentionSchema])),
});

const DateSchema = z.object({
  type: z.literal('date'),
  date: z.string(),
  children: z.array(VoidTextSchema),
  id: z.string().optional(),
});

/**
 * Block Elements
 * --------------
 * Schemas for structural blocks like headings, paragraphs, and blockquotes.
 */

// Heading elements (h1 - h6) with optional level override
export const HeaderElementSchema = z
  .object({
    type: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    level: z.number().int().min(1).max(6).optional(),
    children: z.array(z.union([TextSchema, SimpleTextSchema])),
  })
  .merge(AttributesSchema);

const ListStylesAttributesSchema = z.object({
  listStyleType: z
    .enum([
      'disc',
      'circle',
      'square',
      'decimal',
      'decimal-leading-zero',
      'todo',
      'lower-alpha',
      'upper-alpha',
      'lower-roman',
      'upper-roman',
    ])
    .optional(),
  listRestart: z.boolean().optional(),
  listRestartPolite: z.boolean().optional(),
  listStart: z.number().int().min(0).optional(),
  indent: z.number().int().min(0).max(20).optional(),
  checked: z.boolean().optional(), //used with todo list style
});

// Paragraph element with optional list styling and indentation
export const ParagraphElementSchema = z
  .object({
    type: z.literal('p'),
    children: z.array(z.union([TextSchema, AnchorSchema, MentionSchema, DateSchema])),
  })
  .merge(AttributesSchema)
  .merge(ListStylesAttributesSchema);

// Blockquote element
export const BlockquoteElementSchema = z
  .object({
    type: z.literal('blockquote'),
    children: z.array(z.union([TextSchema, ParagraphElementSchema, HeaderElementSchema])),
  })
  .merge(AttributesSchema);

// Horizontal rule (<hr>) element
export const HRElementSchema = z.object({
  type: z.literal('hr'),
  children: z.array(TextSchema).default([]),
});

/**
 * Media and Utility Elements
 * --------------------------
 * Schemas for images, emojis, audio, files, and table of contents.
 */

// Image element with optional caption and size attributes
export const ImageElementSchema = z
  .object({
    type: z.literal('img'),
    url: z.string(),
    alt: z.string().optional(),
    width: z.union([z.number(), z.string().regex(/^(?:\d+px|\d+%)$/)]).optional(),
    height: z.number().optional(),
    children: z.array(VoidTextSchema).default([]),
    caption: z.array(z.union([TextSchema, ParagraphElementSchema])).default([]),
    id: z.string().optional(),
  })
  .merge(AttributesSchema);

// Emoji element (inline emoji with fallback code)
export const EmojiElementSchema = z.object({
  type: z.literal('emoji'),
  emoji: z.string().optional(),
  code: z.string().optional(),
  children: z.array(VoidTextSchema).default([]),
  id: z.string().optional(),
});

// Audio element
export const AudioElementSchema = z.object({
  type: z.literal('audio'),
  url: z.string(),
  children: z.array(VoidTextSchema).default([]),
  id: z.string().optional(),
});

// File element for attachments or uploads
export const FileElementSchema = z.object({
  type: z.literal('file'),
  url: z.string(),
  name: z.string(),
  isUpload: z.boolean().optional(),
  children: z.array(VoidTextSchema),
  id: z.string().optional(),
});

// Table of Contents element
export const TocElementSchema = z.object({
  type: z.literal('toc'),
  children: z.array(VoidTextSchema).default([]),
  id: z.string().optional(),
});

/**
 * Code Elements
 * -------------
 * Schemas for code blocks and individual code lines.
 */

// Individual line in a code block
const CodeLineElementSchema = z.object({
  type: z.literal('code_line'),
  children: z.array(SimpleTextSchema),
  id: z.string().optional(),
});

// Code block element with language selection
export const CodeBlockElementSchema = z
  .object({
    type: z.literal('code_block'),
    lang: z
      .enum(['sql', 'yaml', 'javascript', 'typescript', 'python', 'bash', 'json'])
      .default('sql'),
    children: z.array(CodeLineElementSchema),
  })
  .merge(AttributesSchema);

const NestedToggleElementSchema = z
  .object({
    type: z.literal('toggle'),
    children: z.array(z.union([TextSchema, ParagraphElementSchema])),
  })
  .merge(AttributesSchema);

export const ToggleElementSchema = z
  .object({
    type: z.literal('toggle'),
    children: z.array(z.union([TextSchema, ParagraphElementSchema, NestedToggleElementSchema])),
  })
  .merge(AttributesSchema);

/**
 * Callout Element
 * ---------------
 * Custom block for highlighting important notes or warnings.
 */
export const CalloutElementSchema = z
  .object({
    type: z.literal('callout'),
    variant: z.enum(['info', 'warning', 'error', 'success', 'tip', 'note']).optional(),
    icon: z
      .string()
      .regex(/^\p{Emoji}$/u, 'Icon must be a single emoji')
      .optional(),
    backgroundColor: z.string().optional(),
    children: z.array(z.union([TextSchema, ParagraphElementSchema])),
  })
  .merge(AttributesSchema);

/**
 * Layout Elements
 * ---------------
 * Schemas for column-based and table-based layouts.
 */

// Column within a column group
export const ColumnElementSchema = z.object({
  type: z.literal('column'),
  id: z.string().optional(),
  width: z.union([z.string(), z.number()]).optional(),
  children: z.array(
    z.union([
      TextSchema,
      ParagraphElementSchema,
      HeaderElementSchema,
      BlockquoteElementSchema,
      CodeBlockElementSchema,
    ])
  ),
});

// Group of columns for side-by-side layouts
export const ColumnGroupElementSchema = z.object({
  type: z.literal('column_group'),
  children: z.array(ColumnElementSchema),
  id: z.string().optional(),
});

// Table cell types: data cell or header cell
const TableCellTypeEnum = z.enum(['td', 'th']);

// Table cell with optional span settings
export const TableCellElementSchema = z
  .object({
    type: TableCellTypeEnum,
    colSpan: z.number().optional(),
    rowSpan: z.number().optional(),
    children: z.array(z.union([TextSchema, ParagraphElementSchema])).default([]),
  })
  .merge(AttributesSchema);

// Table row containing cells or inline content
export const TableRowElementSchema = z
  .object({
    type: z.literal('tr'),
    children: z
      .array(z.union([TextSchema, ParagraphElementSchema, TableCellElementSchema]))
      .default([]),
  })
  .merge(AttributesSchema);

// Entire table element
export const TableElementSchema = z
  .object({
    type: z.literal('table'),
    children: z.array(TableRowElementSchema).default([]),
  })
  .merge(AttributesSchema);

/**
 * List Elements
 * -------------
 * Schemas for ordered and unordered lists, including nested lists.
 */

const ListTypeEnum = z.enum(['ul', 'ol']);

// Nested list item for complex lists
const NestedListElementSchema = z.object({
  type: z.enum(['li', 'lic', 'lii']),
  children: z.array(z.union([TextSchema, ParagraphElementSchema])).default([]),
});

// List container (unordered or ordered)
export const ListElementSchema = z
  .object({
    type: ListTypeEnum,
    start: z.number().optional(),
    children: z.array(
      z.object({
        type: z.literal('li'),
        children: z
          .array(z.union([TextSchema, ParagraphElementSchema, NestedListElementSchema]))
          .default([]),
      })
    ),
  })
  .merge(AttributesSchema);

// Individual list item (for simple lists)
export const ListItemElementSchema = z.object({
  type: z.literal('li'),
  checked: z.boolean().optional(),
  children: z.array(TextSchema).default([]),
});

// Equation element

export const EquationElementSchema = z.object({
  type: z.literal('equation'),
  id: z.string().optional(),
  texExpression: z.string(),
  children: z.array(VoidTextSchema).default([]),
});

// CUSTOM ELEMENTS

export const MetricElementSchema = z.object({
  type: z.literal('metric'),
  metricId: z.string(),
  children: z.array(VoidTextSchema).default([]),
  caption: z.array(z.union([TextSchema, ParagraphElementSchema])).default([]),
});

export const MediaEmbedElementSchema = z.object({
  type: z.literal('media_embed'),
  id: z.string().optional(),
  url: z.string(),
  width: z.union([z.number(), z.string().regex(/^(?:\d+px|\d+%)$/)]).optional(),
  children: z.array(VoidTextSchema).default([]),
  caption: z.array(z.union([TextSchema, ParagraphElementSchema])).default([]),
});

/**
 * Composite Schemas
 * -----------------
 * Union types representing any report element and arrays thereof.
 */

// Discriminated union of all report element variants
export const ReportElementSchema = z.discriminatedUnion('type', [
  HeaderElementSchema,
  ParagraphElementSchema,
  BlockquoteElementSchema,
  CodeBlockElementSchema,
  CalloutElementSchema,
  ColumnElementSchema,
  ColumnGroupElementSchema,
  HRElementSchema,
  TocElementSchema,
  TableElementSchema,
  TableRowElementSchema,
  TableCellElementSchema,
  EmojiElementSchema,
  ListElementSchema,
  ListItemElementSchema,
  ImageElementSchema,
  AnchorSchema,
  AudioElementSchema,
  FileElementSchema,
  MetricElementSchema,
  ToggleElementSchema,
  MediaEmbedElementSchema,
  EquationElementSchema,
]);

// Array of report elements for complete documents
export const ReportElementsSchema = z.array(ReportElementSchema);

export type TextElement = z.infer<typeof TextSchema>;
export type SimpleTextElement = z.infer<typeof SimpleTextSchema>;
export type MentionElement = z.infer<typeof MentionSchema>;
export type AnchorElement = z.infer<typeof AnchorSchema>;
export type HeaderElement = z.infer<typeof HeaderElementSchema>;
export type ParagraphElement = z.infer<typeof ParagraphElementSchema>;
export type BlockquoteElement = z.infer<typeof BlockquoteElementSchema>;
export type HRElement = z.infer<typeof HRElementSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type EmojiElement = z.infer<typeof EmojiElementSchema>;
export type AudioElement = z.infer<typeof AudioElementSchema>;
export type FileElement = z.infer<typeof FileElementSchema>;
export type TocElement = z.infer<typeof TocElementSchema>;
export type CodeLineElement = z.infer<typeof CodeLineElementSchema>;
export type CodeBlockElement = z.infer<typeof CodeBlockElementSchema>;
export type CalloutElement = z.infer<typeof CalloutElementSchema>;
export type ColumnElement = z.infer<typeof ColumnElementSchema>;
export type ColumnGroupElement = z.infer<typeof ColumnGroupElementSchema>;
export type TableCellElement = z.infer<typeof TableCellElementSchema>;
export type TableRowElement = z.infer<typeof TableRowElementSchema>;
export type TableElement = z.infer<typeof TableElementSchema>;
export type ListElement = z.infer<typeof ListElementSchema>;
export type ListItemElement = z.infer<typeof ListItemElementSchema>;
export type ReportElement = z.infer<typeof ReportElementSchema>;
export type ReportElements = z.infer<typeof ReportElementsSchema>;
export type MetricElement = z.infer<typeof MetricElementSchema>;
