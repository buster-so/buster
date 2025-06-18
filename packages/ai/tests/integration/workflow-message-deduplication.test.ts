import type { CoreMessage, ToolCallPart } from 'ai';
import { describe, expect, it } from 'vitest';

// Helper to create a unique key for a message to detect duplicates
function createMessageKey(msg: CoreMessage): string {
  if (msg.role === 'assistant' && Array.isArray(msg.content)) {
    // For assistant messages with tool calls, use toolCallId as part of the key
    const toolCallIds = msg.content
      .filter(
        (c): c is ToolCallPart =>
          c && typeof c === 'object' && 'type' in c && c.type === 'tool-call'
      )
      .map((c) => c.toolCallId)
      .sort()
      .join(',');
    return `${msg.role}:${toolCallIds}`;
  }
  return `${msg.role}:${JSON.stringify(msg.content)}`;
}

// Helper to find duplicate messages in an array
function findDuplicateMessages(messages: CoreMessage[]): {
  duplicates: CoreMessage[];
  duplicateIndices: number[];
} {
  const seen = new Map<string, { message: CoreMessage; index: number }>();
  const duplicates: CoreMessage[] = [];
  const duplicateIndices: number[] = [];

  messages.forEach((msg, index) => {
    const key = createMessageKey(msg);
    const existing = seen.get(key);

    if (existing) {
      duplicates.push(msg);
      duplicateIndices.push(index);
      console.log(`Duplicate found at index ${index}, original at ${existing.index}:`, {
        key,
        original: existing.message,
        duplicate: msg,
      });
    } else {
      seen.set(key, { message: msg, index });
    }
  });

  return { duplicates, duplicateIndices };
}

describe('Workflow Message Deduplication', () => {
  it('should identify duplicates in the provided message array', () => {
    // This is the actual message array from the user with duplicates
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'of our accessory products, what are the top 5 by revenue this month?',
      },
      {
        role: 'user',
        content: [
          {
            text: '<todo_list>\n        - Below are the items on your TODO list:\n        [ ] Determine how "accessory products" are identified in the data\n[ ] Determine how "revenue" is calculated for products\n[ ] Determine how to filter by "this month"\n[ ] Determine sorting and limit for selecting the top 5 products\n[ ] Determine the visualization type and axes\n        </todo_list>',
            type: 'text',
          },
        ],
      },
      // First occurrence of sequential thinking
      {
        role: 'assistant',
        content: [
          {
            args: {
              thought: 'Let me work through the TODO list items to prepare for this analysis:...',
              isRevision: false,
              thoughtNumber: 1,
              totalThoughts: 3,
              needsMoreThoughts: false,
              nextThoughtNeeded: true,
            },
            type: 'tool-call',
            toolName: 'sequentialThinking',
            toolCallId: 'toolu_01Mvn2dPmMEDzYbsM98pPtaC',
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            result: { success: true },
            toolName: 'sequentialThinking',
            toolCallId: 'toolu_01Mvn2dPmMEDzYbsM98pPtaC',
          },
        ],
      },
      // DUPLICATE of sequential thinking
      {
        role: 'assistant',
        content: [
          {
            args: {
              thought: 'Let me work through the TODO list items to prepare for this analysis:...',
              isRevision: false,
              thoughtNumber: 1,
              totalThoughts: 3,
              needsMoreThoughts: false,
              nextThoughtNeeded: true,
            },
            type: 'tool-call',
            toolName: 'sequentialThinking',
            toolCallId: 'toolu_01Mvn2dPmMEDzYbsM98pPtaC',
          },
        ],
      },
      // First occurrence of executeSql
      {
        role: 'assistant',
        content: [
          {
            args: {
              statements: [
                'SELECT DISTINCT name FROM ont_ont.product_category ORDER BY name',
                'SELECT DISTINCT name FROM ont_ont.product_subcategory ORDER BY name LIMIT 25',
                'SELECT DISTINCT year, quarter, month FROM ont_ont.product_total_revenue ORDER BY year DESC, quarter DESC, month DESC LIMIT 10',
                'SELECT DISTINCT year, quarter, month FROM ont_ont.total_sales_revenue ORDER BY year DESC, quarter DESC, month DESC LIMIT 10',
              ],
            },
            type: 'tool-call',
            toolName: 'executeSql',
            toolCallId: 'toolu_01QapQLfLbueC1q2r17Q2gwb',
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            result: {
              /* results */
            },
            toolName: 'executeSql',
            toolCallId: 'toolu_01QapQLfLbueC1q2r17Q2gwb',
          },
        ],
      },
      // DUPLICATE of executeSql
      {
        role: 'assistant',
        content: [
          {
            args: {
              statements: [
                'SELECT DISTINCT name FROM ont_ont.product_category ORDER BY name',
                'SELECT DISTINCT name FROM ont_ont.product_subcategory ORDER BY name LIMIT 25',
                'SELECT DISTINCT year, quarter, month FROM ont_ont.product_total_revenue ORDER BY year DESC, quarter DESC, month DESC LIMIT 10',
                'SELECT DISTINCT year, quarter, month FROM ont_ont.total_sales_revenue ORDER BY year DESC, quarter DESC, month DESC LIMIT 10',
              ],
            },
            type: 'tool-call',
            toolName: 'executeSql',
            toolCallId: 'toolu_01QapQLfLbueC1q2r17Q2gwb',
          },
        ],
      },
    ];

    const { duplicates, duplicateIndices } = findDuplicateMessages(messages);

    // We expect 2 duplicates
    expect(duplicates).toHaveLength(2);
    expect(duplicateIndices).toEqual([4, 7]);

    // Check that the duplicates have the same toolCallId as their originals
    const firstDuplicate = messages[4];
    const firstOriginal = messages[2];
    if (
      firstDuplicate &&
      firstOriginal &&
      Array.isArray(firstDuplicate.content) &&
      Array.isArray(firstOriginal.content)
    ) {
      const firstDupContent = firstDuplicate.content[0];
      const firstOrigContent = firstOriginal.content[0];
      if (
        firstDupContent &&
        typeof firstDupContent === 'object' &&
        'toolCallId' in firstDupContent &&
        firstOrigContent &&
        typeof firstOrigContent === 'object' &&
        'toolCallId' in firstOrigContent
      ) {
        expect(firstDupContent.toolCallId).toBe(firstOrigContent.toolCallId);
      }
    }

    const secondDuplicate = messages[7];
    const secondOriginal = messages[5];
    if (
      secondDuplicate &&
      secondOriginal &&
      Array.isArray(secondDuplicate.content) &&
      Array.isArray(secondOriginal.content)
    ) {
      const secondDupContent = secondDuplicate.content[0];
      const secondOrigContent = secondOriginal.content[0];
      if (
        secondDupContent &&
        typeof secondDupContent === 'object' &&
        'toolCallId' in secondDupContent &&
        secondOrigContent &&
        typeof secondOrigContent === 'object' &&
        'toolCallId' in secondOrigContent
      ) {
        expect(secondDupContent.toolCallId).toBe(secondOrigContent.toolCallId);
      }
    }
  });

  it('should provide a deduplication function', () => {
    function deduplicateMessages(messages: CoreMessage[]): CoreMessage[] {
      const seen = new Set<string>();
      const deduplicated: CoreMessage[] = [];

      for (const msg of messages) {
        const key = createMessageKey(msg);
        if (!seen.has(key)) {
          seen.add(key);
          deduplicated.push(msg);
        }
      }

      return deduplicated;
    }

    // Test with duplicates
    const messagesWithDuplicates: CoreMessage[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
      { role: 'assistant', content: 'Hi' }, // Duplicate
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test123',
            toolName: 'test',
            args: {},
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'test123', // Same ID = duplicate
            toolName: 'test',
            args: {},
          },
        ],
      },
    ];

    const deduplicated = deduplicateMessages(messagesWithDuplicates);
    expect(deduplicated).toHaveLength(3); // Original 5 - 2 duplicates = 3
  });
});
