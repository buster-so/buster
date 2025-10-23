import { z } from 'zod';

/**
 * Paste Handler - Utilities for detecting and handling paste operations
 *
 * This module provides pure functions for:
 * - Detecting when a user pastes text vs. types
 * - Efficiently inserting large text blocks at cursor position
 *
 * Following functional programming principles:
 * - Pure functions with no side effects
 * - Zod-first type safety
 * - Immutable data structures
 */

// ============================================================================
// Zod Schemas & Types
// ============================================================================

/**
 * Input parameters for paste detection
 */
export const PasteInputSchema = z.object({
  input: z.string().describe('Input string received from useInput hook'),
  hasSpecialKeys: z
    .boolean()
    .describe('Whether special keys (ctrl, alt, meta, shift) were pressed during input'),
});

export type PasteInput = z.infer<typeof PasteInputSchema>;

/**
 * Parameters for cursor-based text insertion
 */
export const InsertTextParamsSchema = z.object({
  currentValue: z.string().describe('Current text value before insertion'),
  cursorPosition: z.number().describe('Current cursor position (0-based index)'),
  textToInsert: z.string().describe('Text to insert at cursor position'),
});

export type InsertTextParams = z.infer<typeof InsertTextParamsSchema>;

/**
 * Result of text insertion operation
 */
export const InsertTextResultSchema = z.object({
  newValue: z.string().describe('New text value after insertion'),
  newCursorPosition: z.number().describe('New cursor position after insertion'),
});

export type InsertTextResult = z.infer<typeof InsertTextResultSchema>;

// ============================================================================
// Pure Functions
// ============================================================================

/**
 * Detects whether input is from a paste operation vs. typing
 *
 * Heuristic: Paste is detected when:
 * - Input has 2+ characters AND
 * - No special keys are pressed (ctrl/alt/meta/shift)
 *
 * Rationale:
 * - Normal typing produces single characters per input event
 * - Paste operations produce multiple characters at once
 * - Special key combinations (Ctrl+V) are handled by terminal before we see them
 *
 * @param input - Input parameters
 * @returns true if input appears to be from paste, false otherwise
 *
 * @example
 * detectPaste({ input: 'a', hasSpecialKeys: false }) // false - single char typed
 * detectPaste({ input: 'hello world', hasSpecialKeys: false }) // true - paste detected
 * detectPaste({ input: 'ab', hasSpecialKeys: true }) // false - special keys used
 */
export function detectPaste(input: PasteInput): boolean {
  // Validate input with Zod
  const validated = PasteInputSchema.parse(input);

  // Empty input is never a paste
  if (validated.input.length === 0) {
    return false;
  }

  // Single character input is normal typing, not paste
  if (validated.input.length === 1) {
    return false;
  }

  // Multi-character input with special keys is likely a keyboard shortcut
  if (validated.hasSpecialKeys) {
    return false;
  }

  // Multi-character input without special keys indicates paste
  return true;
}

/**
 * Inserts text at a specific cursor position in a string
 *
 * This function is optimized for large text insertions (100+ lines).
 * It uses string slicing rather than character-by-character operations.
 *
 * Handles edge cases:
 * - Negative cursor position (clamps to 0)
 * - Cursor beyond string length (clamps to end)
 * - Empty insertions (no-op)
 * - Unicode characters
 *
 * @param params - Insertion parameters
 * @returns New value and cursor position after insertion
 *
 * @example
 * insertTextAtCursor({
 *   currentValue: 'hello world',
 *   cursorPosition: 5,
 *   textToInsert: ' beautiful'
 * })
 * // Returns: { newValue: 'hello beautiful world', newCursorPosition: 15 }
 */
export function insertTextAtCursor(params: InsertTextParams): InsertTextResult {
  // Validate input with Zod
  const validated = InsertTextParamsSchema.parse(params);

  const { currentValue, textToInsert } = validated;

  // Clamp cursor position to valid range [0, currentValue.length]
  const clampedCursor = Math.max(0, Math.min(validated.cursorPosition, currentValue.length));

  // Handle empty insertion (no-op)
  if (textToInsert.length === 0) {
    return {
      newValue: currentValue,
      newCursorPosition: clampedCursor,
    };
  }

  // Efficient string slicing for insertion
  // Split at cursor: [before cursor][insert text][after cursor]
  const before = currentValue.slice(0, clampedCursor);
  const after = currentValue.slice(clampedCursor);
  const newValue = before + textToInsert + after;

  // Calculate new cursor position (after inserted text)
  const newCursorPosition = clampedCursor + textToInsert.length;

  return {
    newValue,
    newCursorPosition,
  };
}
