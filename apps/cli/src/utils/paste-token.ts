import { z } from 'zod';

/**
 * Paste Token Utilities - For collapsed paste display
 *
 * This module provides pure functions for:
 * - Creating tokens for large pasted text (e.g., "[Pasted text #1 +506 lines]")
 * - Determining if text should be collapsed (> 5 lines)
 * - Reconstructing actual text from display text with tokens
 *
 * Following functional programming principles:
 * - Pure functions with no side effects
 * - Zod-first type safety
 * - Immutable data structures
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Threshold for collapsing pasted text
 * Text with more than this many lines will be collapsed
 */
export const COLLAPSE_THRESHOLD = 5;

// ============================================================================
// Zod Schemas & Types
// ============================================================================

/**
 * Parameters for creating a paste token
 */
export const CreatePasteTokenParamsSchema = z.object({
  text: z.string().describe('The pasted text to create a token for'),
  tokenNumber: z
    .number()
    .int()
    .positive()
    .describe('The sequential number for this paste (1, 2, 3, etc.)'),
});

export type CreatePasteTokenParams = z.infer<typeof CreatePasteTokenParamsSchema>;

/**
 * Result of creating a paste token
 */
export const PasteTokenResultSchema = z.object({
  token: z.string().describe('The display token (e.g., "[Pasted text #1 +10 lines]")'),
  actualText: z.string().describe('The original full pasted text'),
  lineCount: z.number().int().positive().describe('Number of lines in the pasted text'),
  tokenNumber: z.number().int().positive().describe('The sequential number for this paste'),
});

export type PasteTokenResult = z.infer<typeof PasteTokenResultSchema>;

/**
 * Parameters for reconstructing actual text
 */
export const ReconstructTextParamsSchema = z.object({
  displayText: z.string().describe('The text with tokens shown to user'),
  tokenMap: z.record(z.string()).describe('Map of token -> actual text'),
});

export type ReconstructTextParams = z.infer<typeof ReconstructTextParamsSchema>;

/**
 * Map of tokens to their actual content
 * Key: token string (e.g., "[Pasted text #1 +10 lines]")
 * Value: actual pasted text
 */
export type TokenMap = Record<string, string>;

// ============================================================================
// Pure Functions
// ============================================================================

/**
 * Counts the number of lines in a text string
 *
 * A line is defined as text separated by newline characters.
 * Handles both Unix (\n), Windows (\r\n), and Mac (\r) line endings.
 * Empty string is considered 1 line.
 *
 * @param text - The text to count lines in
 * @returns Number of lines in the text
 *
 * @example
 * countLines('hello') // 1
 * countLines('hello\nworld') // 2
 * countLines('line1\nline2\nline3') // 3
 * countLines('line1\rline2\rline3') // 3 (Mac line endings)
 */
export function countLines(text: string): number {
  if (text === '') {
    return 1;
  }

  // Normalize line endings: \r\n -> \n, \r -> \n
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Count newlines and add 1
  // "a\nb\nc" has 2 newlines = 3 lines
  // "a\nb\n" has 2 newlines but trailing newline doesn't create a new line = 2 lines
  const lines = normalized.split('\n');

  // If the last line is empty (text ends with \n), don't count it
  if (lines[lines.length - 1] === '') {
    return lines.length - 1;
  }

  return lines.length;
}

/**
 * Determines if pasted text should be collapsed based on line count
 *
 * Text is collapsed if it has more than COLLAPSE_THRESHOLD (5) lines
 *
 * @param text - The pasted text to check
 * @returns true if text should be collapsed, false otherwise
 *
 * @example
 * shouldCollapsePaste('line1\nline2') // false (2 lines)
 * shouldCollapsePaste('1\n2\n3\n4\n5\n6') // true (6 lines > 5)
 */
export function shouldCollapsePaste(text: string): boolean {
  return countLines(text) > COLLAPSE_THRESHOLD;
}

/**
 * Creates a token for large pasted text
 *
 * Generates a token in the format: "[Pasted text #N +X lines]"
 * where N is the token number and X is the line count
 *
 * @param params - Token creation parameters
 * @returns Token information including display token and actual text
 *
 * @example
 * createPasteToken({ text: 'a\nb\nc\nd\ne\nf', tokenNumber: 1 })
 * // Returns: { token: '[Pasted text #1 +6 lines]', actualText: 'a\nb\nc\nd\ne\nf', lineCount: 6, tokenNumber: 1 }
 */
export function createPasteToken(params: CreatePasteTokenParams): PasteTokenResult {
  // Validate input with Zod
  const validated = CreatePasteTokenParamsSchema.parse(params);

  const lineCount = countLines(validated.text);
  const token = `[Pasted text #${validated.tokenNumber} +${lineCount} lines]`;

  return {
    token,
    actualText: validated.text,
    lineCount,
    tokenNumber: validated.tokenNumber,
  };
}

/**
 * Reconstructs the actual text from display text by replacing tokens
 *
 * Takes text with tokens (what user sees) and replaces all tokens with
 * their actual content from the token map.
 *
 * If a token is not in the map (e.g., user deleted it), it remains as-is.
 *
 * @param params - Reconstruction parameters
 * @returns The actual text with all tokens replaced
 *
 * @example
 * reconstructActualText({
 *   displayText: 'Query: [Pasted text #1 +3 lines]',
 *   tokenMap: { '[Pasted text #1 +3 lines]': 'SELECT *\nFROM users\nWHERE id = 1' }
 * })
 * // Returns: 'Query: SELECT *\nFROM users\nWHERE id = 1'
 */
export function reconstructActualText(params: ReconstructTextParams): string {
  // Validate input with Zod
  const validated = ReconstructTextParamsSchema.parse(params);

  let result = validated.displayText;

  // Replace each token with its actual content
  for (const [token, actualText] of Object.entries(validated.tokenMap)) {
    // Use global replace to handle multiple occurrences of the same token
    result = result.split(token).join(actualText);
  }

  return result;
}
