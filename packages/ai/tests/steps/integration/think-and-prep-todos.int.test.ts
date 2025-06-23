import { RuntimeContext } from '@mastra/core/runtime-context';
import { initLogger } from 'braintrust';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { thinkAndPrepStep } from '../../../src/steps/think-and-prep-step';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

describe('Think and Prep Step - Todos in Message History Integration', { timeout: 30000 }, () => {
  beforeAll(() => {
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY || '',
      projectName: 'THINK-AND-PREP-TODOS',
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test('should inject todos into message history as tool calls', async () => {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>([
      ['userId', '550e8400-e29b-41d4-a716-446655440000'],
      ['chatId', '550e8400-e29b-41d4-a716-446655440001'],
      ['dataSourceId', '550e8400-e29b-41d4-a716-446655440002'],
      ['dataSourceSyntax', 'postgres'],
      ['organizationId', '550e8400-e29b-41d4-a716-446655440003'],
    ]);

    const todos = `[ ] Determine how "sales" is identified
[ ] Determine the time frame for analysis
[ ] Determine the visualization type and axes`;

    const inputData = {
      'create-todos': { todos },
      'extract-values-search': {
        values: [],
        searchResults: '',
        foundValues: {},
        searchPerformed: false,
      },
      'generate-chat-title': { chatTitle: 'Test Sales Analysis' },
      prompt: 'Show me sales data for the last quarter',
      conversationHistory: [],
    };

    const getInitData = async () => inputData;

    // Execute the step
    const result = await thinkAndPrepStep.execute({
      inputData,
      getInitData,
      runtimeContext,
    });

    // Verify the output messages contain the todos
    expect(result.outputMessages).toBeDefined();
    expect(Array.isArray(result.outputMessages)).toBe(true);

    // Find the assistant message with tool call
    const todoToolCallMessage = result.outputMessages.find(
      (msg) =>
        msg.role === 'assistant' &&
        Array.isArray(msg.content) &&
        msg.content.some((c) => c.type === 'tool-call' && c.toolName === 'createToDos')
    );

    expect(todoToolCallMessage).toBeDefined();

    // Verify the tool call contains the todos
    if (todoToolCallMessage && Array.isArray(todoToolCallMessage.content)) {
      const toolCall = todoToolCallMessage.content.find(
        (c): c is any => c.type === 'tool-call' && (c as any).toolName === 'createToDos'
      );

      expect(toolCall).toBeDefined();
      if (toolCall) {
        expect(toolCall.args?.todos).toBe(todos);
        expect(toolCall.toolCallId).toBe('create-todos-call');
      }
    }

    // Find the tool result message
    const todoResultMessage = result.outputMessages.find(
      (msg) =>
        msg.role === 'tool' &&
        Array.isArray(msg.content) &&
        msg.content.some((c) => c.type === 'tool-result' && c.toolName === 'createToDos')
    );

    expect(todoResultMessage).toBeDefined();

    // Verify the tool result contains success
    if (todoResultMessage && Array.isArray(todoResultMessage.content)) {
      const toolResult = todoResultMessage.content.find(
        (c): c is any => c.type === 'tool-result' && (c as any).toolName === 'createToDos'
      );
      expect(toolResult).toBeDefined();
      if (toolResult) {
        expect(toolResult.result?.success).toBe(true);
      }
    }
  });

  test('should handle conversation history with injected todos', async () => {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>([
      ['userId', '550e8400-e29b-41d4-a716-446655440000'],
      ['chatId', '550e8400-e29b-41d4-a716-446655440001'],
      ['dataSourceId', '550e8400-e29b-41d4-a716-446655440002'],
      ['dataSourceSyntax', 'postgres'],
      ['organizationId', '550e8400-e29b-41d4-a716-446655440003'],
    ]);

    const todos = `[ ] Determine metric for "top customers"
[ ] Determine sorting criteria`;

    const existingHistory = [
      { role: 'user' as const, content: 'Show me our revenue' },
      { role: 'assistant' as const, content: 'Here is your revenue data...' },
    ];

    const inputData = {
      'create-todos': { todos },
      'extract-values-search': {
        values: [],
        searchResults: '',
        foundValues: {},
        searchPerformed: false,
      },
      'generate-chat-title': { chatTitle: 'Top Customers Analysis' },
      prompt: 'Now show me our top customers',
      conversationHistory: existingHistory,
    };

    const getInitData = async () => inputData;

    // Execute the step
    const result = await thinkAndPrepStep.execute({
      inputData,
      getInitData,
      runtimeContext,
    });

    // Verify conversation history is preserved
    expect(result.outputMessages.length).toBeGreaterThan(existingHistory.length);

    // Verify original messages are preserved
    const firstMessage = result.outputMessages[0];
    const secondMessage = result.outputMessages[1];
    const firstHistoryMessage = existingHistory[0];
    const secondHistoryMessage = existingHistory[1];

    if (firstMessage && firstHistoryMessage) {
      expect(firstMessage).toEqual(firstHistoryMessage);
    }
    if (secondMessage && secondHistoryMessage) {
      expect(secondMessage).toEqual(secondHistoryMessage);
    }

    // Verify new user message is added
    const newUserMessage = result.outputMessages.find(
      (msg, index) =>
        index > 1 && msg.role === 'user' && msg.content === 'Now show me our top customers'
    );
    expect(newUserMessage).toBeDefined();

    // Verify todos are injected after the conversation
    const todoMessages = result.outputMessages.filter(
      (msg) =>
        (msg.role === 'assistant' &&
          Array.isArray(msg.content) &&
          msg.content.some(
            (c) => c.type === 'tool-call' && (c as any).toolName === 'createToDos'
          )) ||
        (msg.role === 'tool' &&
          Array.isArray(msg.content) &&
          msg.content.some(
            (c) => c.type === 'tool-result' && (c as any).toolName === 'createToDos'
          ))
    );

    expect(todoMessages).toHaveLength(2); // One tool call, one tool result
  });

  test('should properly format empty todos', async () => {
    const runtimeContext = new RuntimeContext<AnalystRuntimeContext>([
      ['userId', '550e8400-e29b-41d4-a716-446655440000'],
      ['chatId', '550e8400-e29b-41d4-a716-446655440001'],
      ['dataSourceId', '550e8400-e29b-41d4-a716-446655440002'],
      ['dataSourceSyntax', 'postgres'],
      ['organizationId', '550e8400-e29b-41d4-a716-446655440003'],
    ]);

    const inputData = {
      'create-todos': { todos: '' },
      'extract-values-search': {
        values: [],
        searchResults: '',
        foundValues: {},
        searchPerformed: false,
      },
      'generate-chat-title': { chatTitle: 'Empty Todos Test' },
      prompt: 'Simple request',
      conversationHistory: [],
    };

    const getInitData = async () => inputData;

    // Execute the step
    const result = await thinkAndPrepStep.execute({
      inputData,
      getInitData,
      runtimeContext,
    });

    // Verify empty todos are still injected
    const todoMessages = result.outputMessages.filter(
      (msg) =>
        (msg.role === 'assistant' &&
          Array.isArray(msg.content) &&
          msg.content.some(
            (c) => c.type === 'tool-call' && (c as any).toolName === 'createToDos'
          )) ||
        (msg.role === 'tool' &&
          Array.isArray(msg.content) &&
          msg.content.some(
            (c) => c.type === 'tool-result' && (c as any).toolName === 'createToDos'
          ))
    );

    expect(todoMessages).toHaveLength(2);
  });
});
