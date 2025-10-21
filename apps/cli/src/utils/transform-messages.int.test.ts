import type { ModelMessage } from '@buster/ai';
import { describe, expect, it } from 'vitest';
import { transformModelMessagesToUI } from './transform-messages';

describe('transformModelMessagesToUI - Real API Integration', () => {
  it('should handle complete user-provided conversation JSON', () => {
    // This is the ACTUAL JSON from the user's conversation
    const realConversation: ModelMessage[] = [
      { role: 'user', content: 'ok show me' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_01CfRSa9cRqsq5GqBdW9LXnb',
            toolName: 'read',
            input: {
              file_path:
                '/Users/dallin/worktrees/finish-up-tui/apps/cli/src/commands/main/main.tsx',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_01CfRSa9cRqsq5GqBdW9LXnb',
            toolName: 'read',
            output: {
              type: 'json',
              value: JSON.stringify({
                file_path:
                  '/Users/dallin/worktrees/finish-up-tui/apps/cli/src/commands/main/main.tsx',
                content: 'import ...',
                line_count: 335,
              }),
            },
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Here is the main.tsx file showing the state management...',
          },
        ],
      },
    ];

    const result = transformModelMessagesToUI(realConversation);

    // Validate structure
    expect(result.length).toBeGreaterThan(0);

    // Check user messages
    const userMessages = result.filter((m) => m.message.kind === 'user');
    expect(userMessages).toHaveLength(1);
    if (userMessages[0]!.message.kind === 'user') {
      expect(userMessages[0]!.message.content).toBe('ok show me');
    }

    // Check read tool
    const readMessages = result.filter((m) => m.message.kind === 'read');
    expect(readMessages.length).toBeGreaterThanOrEqual(1);
    const readComplete = readMessages.find(
      (m) => m.message.kind === 'read' && m.message.event === 'complete'
    );
    expect(readComplete).toBeDefined();
    if (
      readComplete &&
      readComplete.message.kind === 'read' &&
      readComplete.message.event === 'complete'
    ) {
      expect(readComplete.message.result?.file_path).toContain('main.tsx');
    }

    // Check text responses
    const textMessages = result.filter((m) => m.message.kind === 'text-delta');
    expect(textMessages.length).toBeGreaterThan(0);
    if (textMessages[0]!.message.kind === 'text-delta') {
      expect(textMessages[0]!.message.content).toContain('state management');
    }

    // Verify IDs are sequential
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.id).toBeGreaterThan(result[i - 1]!.id);
    }
  });

  it('should handle task tool with nested messages', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'ok can you write some tests with the json I just gave you' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'toolu_018hUgJ5J6rJvMxRexqK2vCL',
            toolName: 'task',
            input: {
              description: 'Find test patterns',
              instructions:
                'Search the codebase for existing transform-messages test files to understand the testing patterns used',
            },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolu_018hUgJ5J6rJvMxRexqK2vCL',
            toolName: 'task',
            output: {
              type: 'json',
              value: JSON.stringify({
                status: 'success',
                summary: 'Found transform-messages.ts but no existing tests',
                messages: [
                  {
                    kind: 'grep',
                    event: 'complete',
                    args: { pattern: 'transform.*test', path: 'apps/cli/src' },
                    result: { matches: [] },
                  },
                ],
              }),
            },
          },
        ],
      },
    ];

    const result = transformModelMessagesToUI(messages);

    // Check user message
    const userMessages = result.filter((m) => m.message.kind === 'user');
    expect(userMessages).toHaveLength(1);
    if (userMessages[0]!.message.kind === 'user') {
      expect(userMessages[0]!.message.content).toContain('write some tests');
    }

    // Check task tool
    const taskMessages = result.filter((m) => m.message.kind === 'task');
    expect(taskMessages.length).toBeGreaterThanOrEqual(1);
    const taskComplete = taskMessages.find(
      (m) => m.message.kind === 'task' && m.message.event === 'complete'
    );
    expect(taskComplete).toBeDefined();
    if (
      taskComplete &&
      taskComplete.message.kind === 'task' &&
      taskComplete.message.event === 'complete'
    ) {
      expect(taskComplete.message.result?.status).toBe('success');
      expect(taskComplete.message.result?.messages).toBeInstanceOf(Array);
      expect(taskComplete.message.result?.messages).toHaveLength(1);
    }
  });

  it('should handle conversation loaded from API and displayed in UI', () => {
    // Simulate loading conversation from API
    const apiMessages: ModelMessage[] = [
      { role: 'user', content: 'Hello' },
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'Hi! How can I help?' }],
      },
    ];

    // Transform for UI display
    const uiMessages = transformModelMessagesToUI(apiMessages);

    // Should be renderable by AgentMessageComponent
    expect(uiMessages).toHaveLength(2);
    expect(uiMessages[0]!.message.kind).toBe('user');
    expect(uiMessages[1]!.message.kind).toBe('text-delta');

    // Each message should have valid kind that router can handle
    const validKinds = [
      'user',
      'text-delta',
      'bash',
      'read',
      'write',
      'edit',
      'grep',
      'ls',
      'task',
      'idle',
    ];
    for (const msg of uiMessages) {
      expect(validKinds).toContain(msg.message.kind);
    }
  });

  it('should handle multi-step conversation with multiple tool calls', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Read two files for me' },
      {
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'call_1',
            toolName: 'read',
            input: { file_path: 'file1.ts' },
          },
          {
            type: 'tool-call',
            toolCallId: 'call_2',
            toolName: 'read',
            input: { file_path: 'file2.ts' },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_1',
            toolName: 'read',
            output: {
              type: 'json',
              value: JSON.stringify({
                file_path: 'file1.ts',
                content: 'File 1 content',
              }),
            },
          },
          {
            type: 'tool-result',
            toolCallId: 'call_2',
            toolName: 'read',
            output: {
              type: 'json',
              value: JSON.stringify({
                file_path: 'file2.ts',
                content: 'File 2 content',
              }),
            },
          },
        ],
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Here are both files',
          },
        ],
      },
    ];

    const result = transformModelMessagesToUI(messages);

    // User message
    expect(result[0]!.message.kind).toBe('user');

    // Two read tool calls, both should be complete
    const readMessages = result.filter((m) => m.message.kind === 'read');
    expect(readMessages).toHaveLength(2);
    if (
      readMessages[0] &&
      readMessages[0].message.kind === 'read' &&
      readMessages[0].message.event === 'complete'
    ) {
      expect(readMessages[0].message.result?.file_path).toBe('file1.ts');
    }
    if (
      readMessages[1] &&
      readMessages[1].message.kind === 'read' &&
      readMessages[1].message.event === 'complete'
    ) {
      expect(readMessages[1].message.result?.file_path).toBe('file2.ts');
    }

    // Text response
    const textMessages = result.filter((m) => m.message.kind === 'text-delta');
    expect(textMessages).toHaveLength(1);
    if (textMessages[0]!.message.kind === 'text-delta') {
      expect(textMessages[0]!.message.content).toBe('Here are both files');
    }
  });

  it('should handle mixed content (reasoning + text + tool calls)', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'Debug the issue' },
      {
        role: 'assistant',
        content: [
          { type: 'reasoning', text: 'Let me think about this...' },
          { type: 'text', text: 'I will check the logs' },
          {
            type: 'tool-call',
            toolCallId: 'call_123',
            toolName: 'bash',
            input: { command: 'tail -f logs.txt' },
          },
        ],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'call_123',
            toolName: 'bash',
            output: {
              type: 'json',
              value: JSON.stringify({ stdout: 'Log entries...' }),
            },
          },
        ],
      },
    ];

    const result = transformModelMessagesToUI(messages);

    // User message
    expect(result[0]!.message.kind).toBe('user');

    // Text message (reasoning should be skipped)
    const textMessages = result.filter((m) => m.message.kind === 'text-delta');
    expect(textMessages).toHaveLength(1);
    if (textMessages[0]!.message.kind === 'text-delta') {
      expect(textMessages[0]!.message.content).toBe('I will check the logs');
      expect(textMessages[0]!.message.content).not.toContain('Let me think');
    }

    // Bash tool call
    const bashMessages = result.filter((m) => m.message.kind === 'bash');
    expect(bashMessages).toHaveLength(1);
    expect(bashMessages[0]!.message).toHaveProperty('event', 'complete');
  });
});
