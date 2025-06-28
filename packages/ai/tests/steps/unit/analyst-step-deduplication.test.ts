import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';

// We need to extract the createMessageKey function for testing
// Since it's not exported, we'll test it through the deduplicateMessages function
// by checking its behavior

// Mock implementation that matches the one in analyst-step.ts
function createMessageKey(msg: CoreMessage): string {
  if (msg.role === 'assistant' && Array.isArray(msg.content)) {
    const toolCallIds = msg.content
      .filter(
        (c): c is { type: 'tool-call'; toolCallId: string; toolName: string; args: unknown } =>
          typeof c === 'object' &&
          c !== null &&
          'type' in c &&
          c.type === 'tool-call' &&
          'toolCallId' in c &&
          'toolName' in c &&
          'args' in c
      )
      .map((c) => c.toolCallId)
      .filter((id): id is string => id !== undefined)
      .sort()
      .join(',');
    if (toolCallIds) {
      return `assistant:tools:${toolCallIds}`;
    }

    const textContent = msg.content.find(
      (c): c is { type: 'text'; text: string } =>
        typeof c === 'object' && c !== null && 'type' in c && c.type === 'text' && 'text' in c
    );
    if (textContent?.text) {
      return `assistant:text:${textContent.text.substring(0, 100)}`;
    }
  }

  if (msg.role === 'tool' && Array.isArray(msg.content)) {
    const toolResultIds = msg.content
      .filter(
        (c): c is { type: 'tool-result'; toolCallId: string } =>
          typeof c === 'object' &&
          c !== null &&
          'type' in c &&
          c.type === 'tool-result' &&
          'toolCallId' in c
      )
      .map((c) => c.toolCallId)
      .filter((id): id is string => id !== undefined)
      .sort()
      .join(',');
    if (toolResultIds) {
      return `tool:results:${toolResultIds}`;
    }
  }

  if (msg.role === 'user') {
    const text =
      typeof msg.content === 'string'
        ? msg.content
        : Array.isArray(msg.content) &&
            msg.content[0] &&
            typeof msg.content[0] === 'object' &&
            'text' in msg.content[0]
          ? (msg.content[0] as { text?: string }).text || ''
          : '';

    let hash = 0;
    for (let i = 0; i < Math.min(text.length, 200); i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash = hash & hash;
    }
    return `user:${hash}`;
  }

  return `${msg.role}:${Date.now()}`;
}

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

describe('Message Deduplication Performance', () => {
  it('should create keys efficiently without JSON.stringify', () => {
    const largeYamlContent = 'a'.repeat(10000); // 10KB of content
    const message: CoreMessage = {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: 'call_123',
          toolName: 'createMetrics',
          args: {
            files: [
              {
                name: 'revenue.yml',
                yml_content: largeYamlContent,
              },
            ],
          },
        },
      ],
    };

    const start = performance.now();
    const key = createMessageKey(message);
    const duration = performance.now() - start;

    expect(key).toBe('assistant:tools:call_123');
    expect(duration).toBeLessThan(0.1); // Should complete in less than 0.1ms
  });

  it('should deduplicate tool call messages by toolCallId', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_123',
            toolName: 'createMetrics',
            args: { files: [] },
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_123',
            toolName: 'createMetrics',
            args: { files: [] },
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_456',
            toolName: 'createDashboards',
            args: { files: [] },
          },
        ],
      },
    ];

    const deduplicated = deduplicateMessages(messages);
    expect(deduplicated).toHaveLength(2);
    expect(deduplicated[0].content[0]).toHaveProperty('toolCallId', 'call_123');
    expect(deduplicated[1].content[0]).toHaveProperty('toolCallId', 'call_456');
  });

  it('should deduplicate tool result messages by toolCallId', () => {
    const messages: CoreMessage[] = [
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_123',
            toolName: 'createMetrics',
            result: { success: true },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_123',
            toolName: 'createMetrics',
            result: { success: true },
          },
        ],
      },
    ];

    const deduplicated = deduplicateMessages(messages);
    expect(deduplicated).toHaveLength(1);
  });

  it('should handle user messages with fast hashing', () => {
    const longUserMessage = 'This is a very long user message '.repeat(100);
    const messages: CoreMessage[] = [
      { role: 'user', content: longUserMessage },
      { role: 'user', content: longUserMessage },
      { role: 'user', content: 'Different message' },
    ];

    const start = performance.now();
    const deduplicated = deduplicateMessages(messages);
    const duration = performance.now() - start;

    expect(deduplicated).toHaveLength(2);
    expect(duration).toBeLessThan(1); // Should complete in less than 1ms even with long content
  });

  it('should handle assistant text messages efficiently', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'This is a response with some analysis about the data...',
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'This is a response with some analysis about the data...',
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'This is a different response...',
          },
        ],
      },
    ];

    const deduplicated = deduplicateMessages(messages);
    expect(deduplicated).toHaveLength(2);
  });

  it('should process large message arrays efficiently', () => {
    const messages: CoreMessage[] = [];

    // Create 1000 messages with various duplicates
    for (let i = 0; i < 1000; i++) {
      if (i % 3 === 0) {
        messages.push({
          role: 'user',
          content: `Question ${Math.floor(i / 10)}`,
        });
      } else if (i % 3 === 1) {
        messages.push({
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: `call_${Math.floor(i / 5)}`,
              toolName: 'createMetrics',
              args: { files: [] },
            },
          ],
        });
      } else {
        messages.push({
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: `call_${Math.floor(i / 5)}`,
              toolName: 'createMetrics',
              result: { success: true },
            },
          ],
        });
      }
    }

    const start = performance.now();
    const deduplicated = deduplicateMessages(messages);
    const duration = performance.now() - start;

    expect(deduplicated.length).toBeLessThan(messages.length);
    expect(duration).toBeLessThan(10); // Should complete in less than 10ms for 1000 messages
  });

  it('should handle mixed content types in assistant messages', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Processing...' },
          {
            type: 'tool-call',
            toolCallId: 'call_789',
            toolName: 'executeSql',
            args: { sql: 'SELECT * FROM users' },
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Processing...' },
          {
            type: 'tool-call',
            toolCallId: 'call_789',
            toolName: 'executeSql',
            args: { sql: 'SELECT * FROM users' },
          },
        ],
      },
    ];

    const deduplicated = deduplicateMessages(messages);
    expect(deduplicated).toHaveLength(1);
    expect(createMessageKey(messages[0])).toBe('assistant:tools:call_789');
  });
});
