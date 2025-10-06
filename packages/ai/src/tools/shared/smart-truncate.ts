import { z } from 'zod';

/**
 * Configuration for truncation limits
 */
export const TruncationConfigSchema = z.object({
  textMaxLength: z.number().default(5000).describe('Maximum length for text fields'),
  jsonMaxLength: z
    .number()
    .default(500)
    .describe('Maximum total character budget for JSON/object fields'),
  arrayMaxItems: z
    .number()
    .default(3)
    .describe('Maximum number of array items to show before truncating'),
  minJsonValueLength: z
    .number()
    .default(20)
    .describe('Minimum characters to allocate per JSON value'),
});

export type TruncationConfig = z.infer<typeof TruncationConfigSchema>;

const DEFAULT_CONFIG: TruncationConfig = {
  textMaxLength: 5000,
  jsonMaxLength: 500,
  arrayMaxItems: 3,
  minJsonValueLength: 20,
};

/**
 * Truncates a string value with an indicator of original length
 */
function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...[${value.length} chars total]`;
}

/**
 * Smart truncation for JSON objects that preserves structure and all keys
 * while staying within a character budget
 */
function truncateJSON(value: unknown, totalBudget: number, config: TruncationConfig): unknown {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle primitives - never truncate these
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  // Handle dates - keep as is
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return [];

    // Calculate budget per item
    const itemsToShow = Math.min(config.arrayMaxItems, value.length);
    const itemBudget = Math.floor(totalBudget / itemsToShow);

    const truncatedItems = value
      .slice(0, itemsToShow)
      .map((item) => truncateJSON(item, itemBudget, config));

    if (value.length > itemsToShow) {
      return [...truncatedItems, `... +${value.length - itemsToShow} more items`];
    }

    return truncatedItems;
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    const keyCount = entries.length;

    if (keyCount === 0) return {};

    // Reserve budget for key names (estimate ~10 chars per key)
    const keyBudget = keyCount * 10;
    const remainingBudget = Math.max(0, totalBudget - keyBudget);

    // Calculate per-value budget
    const perValueBudget = Math.max(
      config.minJsonValueLength,
      Math.floor(remainingBudget / keyCount)
    );

    const result: Record<string, unknown> = {};
    let budgetUsed = 0;
    let keysProcessed = 0;

    for (const [key, val] of entries) {
      // Always try to include at least 10 keys, then check budget
      if (keysProcessed >= 10 && budgetUsed > totalBudget) {
        result['...truncated'] = `${entries.length - keysProcessed} more keys`;
        break;
      }

      if (
        val === null ||
        val === undefined ||
        typeof val === 'boolean' ||
        typeof val === 'number'
      ) {
        result[key] = val;
        budgetUsed += String(val).length;
      } else if (typeof val === 'string') {
        const truncated = truncateString(val, perValueBudget);
        result[key] = truncated;
        budgetUsed += Math.min(val.length, perValueBudget);
      } else if (typeof val === 'object') {
        // Nested objects/arrays get smaller budget
        const nestedBudget = Math.floor(perValueBudget / 2);
        result[key] = truncateJSON(val, nestedBudget, config);
        budgetUsed += nestedBudget;
      } else {
        // Other types - convert to string and truncate
        const strVal = String(val);
        result[key] = truncateString(strVal, perValueBudget);
        budgetUsed += Math.min(strVal.length, perValueBudget);
      }

      keysProcessed++;
    }

    return result;
  }

  // Handle strings (when called directly, not as part of object)
  if (typeof value === 'string') {
    return truncateString(value, totalBudget);
  }

  // Fallback - shouldn't reach here
  return String(value);
}

/**
 * Processes a single column value for truncation based on its type
 */
export function processColumnValue(
  value: unknown,
  config: TruncationConfig = DEFAULT_CONFIG
): unknown {
  // Handle null/undefined - return as is
  if (value === null || value === undefined) {
    return value;
  }

  // Handle primitives - never truncate
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  // Handle dates
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle strings - use text limit
  if (typeof value === 'string') {
    if (value.length > config.textMaxLength) {
      return `${value.slice(0, config.textMaxLength)}...[TRUNCATED - ${value.length} chars total]`;
    }
    return value;
  }

  // Handle objects and arrays - use smart JSON truncation
  if (typeof value === 'object') {
    // First stringify to see if it's small enough to keep as-is
    const stringified = JSON.stringify(value);
    if (stringified.length <= config.jsonMaxLength) {
      return stringified;
    }

    // Apply smart truncation
    const truncated = truncateJSON(value, config.jsonMaxLength, config);
    return JSON.stringify(truncated);
  }

  // Fallback for any other type
  const stringValue = String(value);
  if (stringValue.length > config.textMaxLength) {
    return `${stringValue.slice(0, config.textMaxLength)}...[TRUNCATED - ${stringValue.length} chars total]`;
  }
  return value;
}

/**
 * Truncates query results to prevent overwhelming responses
 * Applies smart truncation to each column value
 */
export function truncateQueryResults(
  rows: Record<string, unknown>[],
  config: TruncationConfig = DEFAULT_CONFIG
): Record<string, unknown>[] {
  return rows.map((row) => {
    const truncatedRow: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      truncatedRow[key] = processColumnValue(value, config);
    }

    return truncatedRow;
  });
}

/**
 * Creates a truncation config with custom values
 */
export function createTruncationConfig(overrides?: Partial<TruncationConfig>): TruncationConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
  };
}
