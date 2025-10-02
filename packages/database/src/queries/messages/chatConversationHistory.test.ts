import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getChatConversationHistory } from './chatConversationHistory';

// Mock the database connection and queries
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn(),
  },
}));

describe('getChatConversationHistory - Orphaned Tool Call Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove orphaned tool calls (tool calls without matching results)', async () => {
    // Mock database to return messages with orphaned tool calls
    const mockMessages: ModelMessage[] = [
      {
        role: 'user',
        content: 'test question',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'orphaned-call-123',
            toolName: 'sequentialThinking',
            input: { thought: 'test thought', nextThoughtNeeded: false },
          },
        ],
      },
      // No tool result for orphaned-call-123
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'valid-call-456',
            toolName: 'executeSql',
            input: { statements: ['SELECT 1'] },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'valid-call-456',
            toolName: 'executeSql',
            output: { type: 'json', value: '{"results":[]}' },
          },
        ],
      },
    ];

    // Mock the database query functions
    const { db } = await import('../../connection');
    vi.mocked(db.orderBy).mockResolvedValue([
      {
        id: 'msg-1',
        rawLlmMessages: mockMessages,
        createdAt: '2025-01-01T00:00:00Z',
        isCompleted: true,
      },
    ]);
    vi.mocked(db.limit).mockResolvedValue([
      {
        chatId: 'chat-123',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ]);

    const result = await getChatConversationHistory({
      messageId: randomUUID(),
    });

    // Should have removed the orphaned tool call but kept the valid one
    expect(result).toHaveLength(3); // user, assistant (with valid tool call), tool result

    // Find the assistant message
    const assistantMessages = result.filter((m) => m.role === 'assistant');
    expect(assistantMessages).toHaveLength(1);

    // The remaining assistant message should only have the valid tool call
    const assistantContent = assistantMessages[0]?.content;
    expect(Array.isArray(assistantContent)).toBe(true);
    if (Array.isArray(assistantContent)) {
      expect(assistantContent).toHaveLength(1);
      expect(assistantContent[0]).toMatchObject({
        type: 'tool-call',
        toolCallId: 'valid-call-456',
      });
    }
  });

  it('should keep assistant messages with valid tool calls', async () => {
    const mockMessages: ModelMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call-123',
            toolName: 'testTool',
            input: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call-123',
            toolName: 'testTool',
            output: { type: 'text', value: 'result' },
          },
        ],
      },
    ];

    const { db } = await import('../../connection');
    vi.mocked(db.orderBy).mockResolvedValue([
      {
        id: 'msg-1',
        rawLlmMessages: mockMessages,
        createdAt: '2025-01-01T00:00:00Z',
        isCompleted: true,
      },
    ]);
    vi.mocked(db.limit).mockResolvedValue([
      {
        chatId: 'chat-123',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ]);

    const result = await getChatConversationHistory({
      messageId: randomUUID(),
    });

    // Should keep both messages (tool call and result)
    expect(result).toHaveLength(2);
    expect(result[0]?.role).toBe('assistant');
    expect(result[1]?.role).toBe('tool');
  });

  it('should keep assistant messages that have at least one valid tool call (even if some are orphaned)', async () => {
    const mockMessages: ModelMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Let me analyze this',
          },
          {
            type: 'tool-call',
            toolCallId: 'orphaned-123',
            toolName: 'orphanedTool',
            input: {},
          },
          {
            type: 'tool-call',
            toolCallId: 'valid-456',
            toolName: 'validTool',
            input: {},
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'valid-456',
            toolName: 'validTool',
            output: { type: 'text', value: 'success' },
          },
        ],
      },
    ];

    const { db } = await import('../../connection');
    vi.mocked(db.orderBy).mockResolvedValue([
      {
        id: 'msg-1',
        rawLlmMessages: mockMessages,
        createdAt: '2025-01-01T00:00:00Z',
        isCompleted: true,
      },
    ]);
    vi.mocked(db.limit).mockResolvedValue([
      {
        chatId: 'chat-123',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ]);

    const result = await getChatConversationHistory({
      messageId: randomUUID(),
    });

    // Should keep the assistant message because it has at least one valid tool call
    // Note: We keep the entire message including the orphaned tool call
    expect(result).toHaveLength(2);

    const assistantMessage = result.find((m) => m.role === 'assistant');
    expect(assistantMessage).toBeDefined();

    const content = assistantMessage?.content;
    expect(Array.isArray(content)).toBe(true);
    if (Array.isArray(content)) {
      // Should have all content including the orphaned tool call (we don't modify the message)
      expect(content).toHaveLength(3);
    }
  });

  it('should remove assistant messages that only contain orphaned tool calls', async () => {
    const mockMessages: ModelMessage[] = [
      {
        role: 'user',
        content: 'test',
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'orphaned-only',
            toolName: 'orphanedTool',
            input: {},
          },
        ],
      },
      // No tool result for orphaned-only
      {
        role: 'assistant',
        content: 'This is a text response',
      },
    ];

    const { db } = await import('../../connection');
    vi.mocked(db.orderBy).mockResolvedValue([
      {
        id: 'msg-1',
        rawLlmMessages: mockMessages,
        createdAt: '2025-01-01T00:00:00Z',
        isCompleted: true,
      },
    ]);
    vi.mocked(db.limit).mockResolvedValue([
      {
        chatId: 'chat-123',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ]);

    const result = await getChatConversationHistory({
      messageId: randomUUID(),
    });

    // Should have removed the assistant message with only orphaned tool call
    expect(result).toHaveLength(2); // user + assistant text response
    expect(result[0]?.role).toBe('user');
    expect(result[1]?.role).toBe('assistant');
    expect(result[1]?.content).toBe('This is a text response');
  });

  it('should handle empty message arrays', async () => {
    const { db } = await import('../../connection');
    vi.mocked(db.orderBy).mockResolvedValue([
      {
        id: 'msg-1',
        rawLlmMessages: [],
        createdAt: '2025-01-01T00:00:00Z',
        isCompleted: true,
      },
    ]);
    vi.mocked(db.limit).mockResolvedValue([
      {
        chatId: 'chat-123',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ]);

    const result = await getChatConversationHistory({
      messageId: randomUUID(),
    });

    expect(result).toEqual([]);
  });

  it('should handle messages with no tool calls', async () => {
    const mockMessages: ModelMessage[] = [
      {
        role: 'user',
        content: 'Hello',
      },
      {
        role: 'assistant',
        content: 'Hi there!',
      },
    ];

    const { db } = await import('../../connection');
    vi.mocked(db.orderBy).mockResolvedValue([
      {
        id: 'msg-1',
        rawLlmMessages: mockMessages,
        createdAt: '2025-01-01T00:00:00Z',
        isCompleted: true,
      },
    ]);
    vi.mocked(db.limit).mockResolvedValue([
      {
        chatId: 'chat-123',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ]);

    const result = await getChatConversationHistory({
      messageId: randomUUID(),
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual(mockMessages);
  });
});
