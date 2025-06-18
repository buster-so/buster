/**
 * Utility to normalize escaped characters in streaming text
 * Prevents double-escaping issues during chunk processing
 */

/**
 * Detects if a string contains double-escaped characters
 */
export function hasDoubleEscaping(text: string): boolean {
  // Check for common double-escaped patterns including backslashes
  return /\\\\[ntr"]|\\\\\\\\/.test(text);
}

/**
 * Normalizes double-escaped characters to single escaping
 * Only processes if double-escaping is detected to avoid unnecessary processing
 */
export function normalizeEscapedText(text: string): string {
  // Quick check - if no double escaping, return as-is
  if (!hasDoubleEscaping(text)) {
    return text;
  }

  // Replace double-escaped characters with single escaping
  const result = text
    .replace(/\\\\n/g, '\n') // \\n -> \n
    .replace(/\\\\t/g, '\t') // \\t -> \t
    .replace(/\\\\r/g, '\r') // \\r -> \r
    .replace(/\\\\"/g, '"') // \\" -> "
    .replace(/\\\\\\\\/g, '\\\\'); // \\\\ -> \\ (4 backslashes to 2)

  return result;
}

/**
 * Safely normalizes text that may contain JSON or regular text
 * Preserves proper JSON escaping while fixing double-escaping in text content
 */
export function normalizeStreamingText(text: string, context: 'json' | 'text' = 'text'): string {
  if (context === 'json') {
    // For JSON context, we need to be more careful
    // Only normalize if we're sure it's double-escaped
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(text);
      // If it parses successfully, check if the content has double escaping
      const stringified = JSON.stringify(parsed);
      if (stringified !== text && hasDoubleEscaping(text)) {
        // The original text has double escaping, normalize it
        return normalizeEscapedText(text);
      }
      // Otherwise it's properly escaped JSON
      return text;
    } catch {
      // If it fails to parse, it might be partial JSON or double-escaped
      // Check if it looks like double-escaped JSON string content
      if (hasDoubleEscaping(text)) {
        return normalizeEscapedText(text);
      }
      return text;
    }
  }

  // For text context, normalize if needed
  return normalizeEscapedText(text);
}

/**
 * Process streaming chunks and normalize escaping
 * Used during tool argument accumulation
 */
export function normalizeStreamingChunk(
  chunk: string,
  previousChunk = ''
): { normalized: string; hasChanges: boolean } {
  // Check if we have double-escaping at the boundary
  const boundaryCheck = previousChunk.slice(-10) + chunk.slice(0, 10);
  const hasBoundaryIssue = hasDoubleEscaping(boundaryCheck);

  if (hasBoundaryIssue || hasDoubleEscaping(chunk)) {
    // Normalize the chunk
    const normalized = normalizeEscapedText(chunk);
    return { normalized, hasChanges: normalized !== chunk };
  }

  return { normalized: chunk, hasChanges: false };
}
