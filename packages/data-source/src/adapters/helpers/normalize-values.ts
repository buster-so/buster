/**
 * Normalizes row values from database queries to ensure consistent JavaScript types.
 * Converts string representations of numbers, dates, and booleans to their proper types.
 * This ensures visualizations and downstream processing receive correctly typed data.
 */
export function normalizeRowValues(row: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    // Preserve null/undefined values
    if (value == null) {
      normalized[key] = value;
      continue;
    }

    // Handle string values that might represent other types
    if (typeof value === 'string' && value !== '') {
      // Check for numeric strings (integers and decimals)
      // Matches: "123", "-456", "78.90", "-12.34"
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        normalized[key] = Number(value);
      }
      // Check for date/timestamp strings
      else if (isValidDateString(value)) {
        normalized[key] = new Date(value);
      }
      // Check for boolean strings
      else if (value === 'true' || value === 'false') {
        normalized[key] = value === 'true';
      }
      // Keep as text string
      else {
        normalized[key] = value;
      }
    }
    // Convert BigInt to number for JSON serialization compatibility
    else if (typeof value === 'bigint') {
      normalized[key] = Number(value);
    }
    // Already correct type - pass through unchanged
    else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Checks if a string value represents a valid date/timestamp.
 * Supports common database date formats.
 */
function isValidDateString(value: string): boolean {
  // Common date/timestamp patterns from databases
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    // ISO and SQL-like timestamps, anchored to end. Allows optional fractional seconds and numeric timezone offsets.
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/, // ISO timestamps and SQL timestamps
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
  ];

  // Check if value matches a date pattern
  const matchesPattern = datePatterns.some((pattern) => pattern.test(value));

  if (matchesPattern) {
    // Verify it's actually a valid date
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  return false;
}
