/**
 * Optimistic JSON parser for streaming tool arguments
 * Attempts to extract values from incomplete JSON by intelligently closing open structures
 */

export interface OptimisticParseResult {
  parsed: Record<string, unknown> | null;
  isComplete: boolean;
  extractedValues: Map<string, unknown>;
}

/**
 * Attempts to parse potentially incomplete JSON by closing open structures
 */
export function parseOptimisticJson(incompleteJson: string): OptimisticParseResult {
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
    extractAllValues(result.parsed, result.extractedValues);
    return result;
  } catch {
    // Continue with optimistic parsing
  }

  // Try to close the JSON optimistically
  const closed = closeIncompleteJson(incompleteJson);

  try {
    result.parsed = JSON.parse(closed);
    // Extract all values we can find
    extractAllValues(result.parsed, result.extractedValues);
  } catch {
    // Even optimistic parsing failed, try to extract raw values
    extractRawValues(incompleteJson, result.extractedValues);
  }

  return result;
}

/**
 * Attempts to close incomplete JSON structures
 */
function closeIncompleteJson(json: string): string {
  let result = json.trim();

  // Handle empty or too short input
  if (result.length === 0) return '{}';
  if (result === '{' || result === '[') return result + (result === '{' ? '}' : ']');

  // Track open structures
  const stack: string[] = [];
  let inString = false;
  let escapeNext = false;
  let lastNonWhitespaceChar = '';
  let lastNonWhitespaceIndex = -1;

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
      lastNonWhitespaceChar = char;
      lastNonWhitespaceIndex = i;
      continue;
    }

    if (!inString) {
      // Track non-whitespace characters for better completion
      if (char && !/\s/.test(char)) {
        lastNonWhitespaceChar = char;
        lastNonWhitespaceIndex = i;
      }

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

  // Handle incomplete values at the end
  if (!inString && lastNonWhitespaceChar && lastNonWhitespaceIndex < result.length - 1) {
    // Check if we have a partial value that needs completion
    const remainingText = result.substring(lastNonWhitespaceIndex + 1).trim();

    // Handle incomplete null
    if (remainingText.match(/^n(?:u(?:l(?:l)?)?)?$/)) {
      result = `${result.substring(0, lastNonWhitespaceIndex + 1)}null`;
    }
    // Handle incomplete true
    else if (remainingText.match(/^tru?e?$/)) {
      result = `${result.substring(0, lastNonWhitespaceIndex + 1)}true`;
    }
    // Handle incomplete false
    else if (remainingText.match(/^fals?e?$/)) {
      result = `${result.substring(0, lastNonWhitespaceIndex + 1)}false`;
    }
  }

  // Close any unclosed strings
  if (inString) {
    // If we're in the middle of an escape sequence, complete it safely
    if (escapeNext) {
      result += 'n'; // Default to newline for incomplete escape
    }
    result += '"';
  }

  // Add any necessary commas or colons before closing
  const trimmedResult = result.trim();
  if (trimmedResult.length > 0) {
    const lastChar = trimmedResult[trimmedResult.length - 1];

    // If the last character is a comma, that's valid for closing
    // If it's a colon, we need to add a default value
    if (lastChar === ':' && stack.length > 0) {
      result += ' null';
    }
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
function extractAllValues(obj: unknown, extractedValues: Map<string, unknown>, prefix = ''): void {
  if (obj === null || obj === undefined) return;

  if (typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      extractedValues.set(fullKey, value);

      if (typeof value === 'object' && value !== null) {
        extractAllValues(value, extractedValues, fullKey);
      }
    }
  }
}

/**
 * Attempt to extract values from raw incomplete JSON
 * This handles cases like: {"message": "Hello wor
 */
function extractRawValues(incompleteJson: string, extractedValues: Map<string, unknown>): void {
  // Look for patterns like "key": "value in progress
  // This regex handles escaped quotes within the string value
  const stringPattern = /"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/g;
  let match: RegExpExecArray | null;

  match = stringPattern.exec(incompleteJson);
  while (match !== null) {
    const [, key, value] = match;
    if (key && value !== undefined) {
      extractedValues.set(key, value);
    }
    match = stringPattern.exec(incompleteJson);
  }

  // Look for patterns like "key": number (including scientific notation)
  const numberPattern = /"([^"]+)"\s*:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g;
  match = numberPattern.exec(incompleteJson);
  while (match !== null) {
    const [, key, value] = match;
    if (key && value) {
      const parsed = Number.parseFloat(value);
      if (!Number.isNaN(parsed)) {
        extractedValues.set(key, parsed);
      }
    }
    match = numberPattern.exec(incompleteJson);
  }

  // Look for patterns like "key": true/false (including incomplete)
  const boolPattern = /"([^"]+)"\s*:\s*(t|tr|tru|true|f|fa|fal|fals|false)/g;
  match = boolPattern.exec(incompleteJson);
  while (match !== null) {
    const [, key, value] = match;
    if (key && value) {
      extractedValues.set(key, value.startsWith('t'));
    }
    match = boolPattern.exec(incompleteJson);
  }

  // Look for patterns like "key": null (including incomplete)
  const nullPattern = /"([^"]+)"\s*:\s*(n|nu|nul|null)/g;
  match = nullPattern.exec(incompleteJson);
  while (match !== null) {
    const [, key] = match;
    if (key) {
      extractedValues.set(key, null);
    }
    match = nullPattern.exec(incompleteJson);
  }
}

// Maintain backward compatibility with the original class-based API
export const OptimisticJsonParser = {
  parse: parseOptimisticJson,
};

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
