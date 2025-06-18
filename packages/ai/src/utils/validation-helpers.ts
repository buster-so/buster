/**
 * Helper function to safely access array elements with TypeScript strict mode
 * (noUncheckedIndexedAccess enabled)
 *
 * @param array - The array to access
 * @param index - The index to access
 * @param context - Context for error messages
 * @returns The element at the index
 * @throws Error if array is undefined or index is out of bounds
 */
export function validateArrayAccess<T>(array: T[] | undefined, index: number, context: string): T {
  if (!array) {
    throw new Error(`Array is undefined in ${context}`);
  }

  const element = array[index];
  if (element === undefined) {
    throw new Error(
      `Array index ${index} is out of bounds (length: ${array.length}) in ${context}`
    );
  }

  return element;
}

/**
 * Helper function to safely access object properties with type narrowing
 *
 * @param obj - The object to check
 * @param property - The property name to check
 * @returns True if the property exists on the object
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  property: K
): obj is T & Record<K, unknown> {
  return property in obj;
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 *
 * @param value - The value to check
 * @returns True if the value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if content has a toolCallId property
 *
 * @param content - The content to check
 * @returns True if the content has a toolCallId property
 */
export function hasToolCallId(
  content: unknown
): content is { toolCallId: string; [key: string]: unknown } {
  return (
    typeof content === 'object' &&
    content !== null &&
    'toolCallId' in content &&
    typeof (content as { toolCallId: unknown }).toolCallId === 'string'
  );
}

/**
 * Type guard for checking if content is a tool call part
 *
 * @param content - The content to check
 * @returns True if the content is a tool call part
 */
export function isToolCallPart(content: unknown): content is {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: unknown;
} {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    (content as { type: unknown }).type === 'tool-call' &&
    'toolCallId' in content &&
    'toolName' in content &&
    'args' in content
  );
}

/**
 * Type guard for checking if content is a tool result part
 *
 * @param content - The content to check
 * @returns True if the content is a tool result part
 */
export function isToolResultPart(content: unknown): content is {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: unknown;
} {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    (content as { type: unknown }).type === 'tool-result' &&
    'toolCallId' in content &&
    'toolName' in content &&
    'result' in content
  );
}
