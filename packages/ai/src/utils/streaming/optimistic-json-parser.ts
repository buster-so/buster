/**
 * Optimistic JSON parser for streaming tool arguments
 * Attempts to extract values from incomplete JSON by intelligently closing open structures
 */

export interface OptimisticParseResult {
  parsed: Record<string, unknown> | null;
  isComplete: boolean;
  extractedValues: Map<string, unknown>;
}

export class OptimisticJsonParser {
  /**
   * Attempts to parse potentially incomplete JSON by closing open structures
   */
  static parse(incompleteJson: string): OptimisticParseResult {
    const result: OptimisticParseResult = {
      parsed: null,
      isComplete: false,
      extractedValues: new Map(),
    };

    if (!incompleteJson || incompleteJson.trim() === '') {
      return result;
    }

    // First, try standard parsing (it might be complete)
    try {
      result.parsed = JSON.parse(incompleteJson);
      result.isComplete = true;
      this.extractAllValues(result.parsed, result.extractedValues);
      return result;
    } catch {
      // Continue with optimistic parsing
    }

    // Try to close the JSON optimistically
    const closed = this.closeIncompleteJson(incompleteJson);

    try {
      result.parsed = JSON.parse(closed);
      // Extract all values we can find
      this.extractAllValues(result.parsed, result.extractedValues);
    } catch {
      // Even optimistic parsing failed, try to extract raw values
      this.extractRawValues(incompleteJson, result.extractedValues);
    }

    return result;
  }

  /**
   * Attempts to close incomplete JSON structures
   */
  private static closeIncompleteJson(json: string): string {
    let result = json.trim();

    // Track open structures
    const stack: string[] = [];
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < result.length; i++) {
      const char = result[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') stack.push('}');
        else if (char === '[') stack.push(']');
        else if (char === '}' || char === ']') {
          const expected = stack.pop();
          if (expected !== char) {
            // Mismatched bracket, this is malformed
            // Try to recover by putting it back
            if (expected) stack.push(expected);
          }
        }
      }
    }

    // Close any unclosed strings
    if (inString) {
      result += '"';
    }

    // Close any unclosed structures in reverse order
    while (stack.length > 0) {
      result += stack.pop();
    }

    return result;
  }

  /**
   * Extract all values from a parsed object into the map
   */
  private static extractAllValues(
    obj: unknown,
    extractedValues: Map<string, unknown>,
    prefix = ''
  ): void {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        extractedValues.set(fullKey, value);

        if (typeof value === 'object' && value !== null) {
          this.extractAllValues(value, extractedValues, fullKey);
        }
      }
    }
  }

  /**
   * Attempt to extract values from raw incomplete JSON
   * This handles cases like: {"message": "Hello wor
   */
  private static extractRawValues(
    incompleteJson: string,
    extractedValues: Map<string, unknown>
  ): void {
    // Look for patterns like "key": "value in progress
    const stringPattern = /"([^"]+)"\s*:\s*"([^"]*)/g;
    let match;

    while ((match = stringPattern.exec(incompleteJson)) !== null) {
      const [, key, value] = match;
      if (key && value !== undefined) {
        extractedValues.set(key, value);
      }
    }

    // Look for patterns like "key": number
    const numberPattern = /"([^"]+)"\s*:\s*(-?\d+\.?\d*)/g;
    while ((match = numberPattern.exec(incompleteJson)) !== null) {
      const [, key, value] = match;
      if (key && value) {
        extractedValues.set(key, Number.parseFloat(value));
      }
    }

    // Look for patterns like "key": true/false (including incomplete)
    const boolPattern = /"([^"]+)"\s*:\s*(tru|true|fals|false)/g;
    while ((match = boolPattern.exec(incompleteJson)) !== null) {
      const [, key, value] = match;
      if (key && value) {
        extractedValues.set(key, value.startsWith('tru'));
      }
    }
  }
}

/**
 * Helper to get a value from extracted values with type safety
 */
export function getOptimisticValue<T>(
  extractedValues: Map<string, unknown>,
  key: string,
  defaultValue?: T
): T | undefined {
  return (extractedValues.get(key) as T) ?? defaultValue;
}
