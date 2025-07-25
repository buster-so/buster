import { RuntimeContext } from '@mastra/core/runtime-context';
import { describe, expect, test } from 'vitest';
import { formatOutputStep } from './format-output-step';

// Mock execution context types
interface MockStepContext {
  inputData: unknown;
  getInitData: () => Promise<{ prompt: string }>;
  runtimeContext: unknown;
  runId: string;
  mastra: Record<string, unknown>;
  getStepResult: () => Promise<Record<string, unknown>>;
  suspend: () => Promise<void>;
  emitter?: Record<string, unknown>;
}

describe('Format Output Step Unit Tests', () => {
  test('should handle analyst step output', async () => {
    const analystOutput = {
      conversationHistory: [
        { role: 'user' as const, content: 'Analyze data' },
        { role: 'assistant' as const, content: 'Analysis complete' },
      ],
      finished: true,
      stepData: {
        stepType: 'analyst',
        text: 'Analysis response',
        reasoning: 'Test reasoning',
        reasoningDetails: [],
        files: [],
        sources: [],
        toolCalls: [],
        toolResults: [],
        finishReason: 'completed',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
        warnings: [],
        request: {
          model: 'claude-sonnet-4',
          messages: [],
          temperature: 0,
          maxTokens: 10000,
          tools: [],
        },
        response: {
          id: 'test-id',
          timestamp: new Date(),
          modelId: 'claude-sonnet-4',
          headers: {},
          messages: [],
        },
      },
      metadata: {
        toolsUsed: ['doneTool'],
        finalTool: 'doneTool',
      },
    };

    const runtimeContext = new RuntimeContext([]);

    const mockContext: MockStepContext = {
      inputData: analystOutput,
      getInitData: async () => ({ prompt: 'test' }),
      runtimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await formatOutputStep.execute(mockContext as any);

    expect(result).toEqual({
      conversationHistory: analystOutput.conversationHistory,
      finished: analystOutput.finished,
      stepData: analystOutput.stepData,
      metadata: analystOutput.metadata,
      title: undefined,
      todos: undefined,
      values: undefined,
      reasoningHistory: [],
      responseHistory: [],
    });
  });

  test('should handle analyst pass-through output (from think-and-prep)', async () => {
    const passthroughOutput = {
      conversationHistory: [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ],
      finished: true,
      metadata: {
        toolsUsed: ['respondWithoutAssetCreation'],
        finalTool: 'respondWithoutAssetCreation',
      },
    };

    const runtimeContext = new RuntimeContext([]);

    const mockContext: MockStepContext = {
      inputData: passthroughOutput,
      getInitData: async () => ({ prompt: 'test' }),
      runtimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await formatOutputStep.execute(mockContext as any);

    expect(result.conversationHistory).toEqual(passthroughOutput.conversationHistory);
    expect(result.finished).toBe(true);
    expect(result.metadata).toEqual(passthroughOutput.metadata);
  });

  test('should handle missing optional fields', async () => {
    const minimalOutput = {
      conversationHistory: [{ role: 'user' as const, content: 'test' }],
    };

    const runtimeContext = new RuntimeContext([]);

    const mockContext: MockStepContext = {
      inputData: minimalOutput,
      getInitData: async () => ({ prompt: 'test' }),
      runtimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await formatOutputStep.execute(mockContext as any);

    expect(result.conversationHistory).toEqual(minimalOutput.conversationHistory);
    expect(result.finished).toBe(false);
    expect(result.stepData).toBeUndefined();
    expect(result.metadata).toBeUndefined();
  });

  test('should handle empty arrays gracefully', async () => {
    const emptyOutput = {
      conversationHistory: [],
      finished: false,
    };

    const runtimeContext = new RuntimeContext([]);

    const mockContext: MockStepContext = {
      inputData: emptyOutput,
      getInitData: async () => ({ prompt: 'test' }),
      runtimeContext,
      runId: 'test-run',
      mastra: {},
      getStepResult: async () => ({}),
      suspend: async () => {},
      [Symbol.for('emitter')]: {},
    };

    const result = await formatOutputStep.execute(mockContext as any);

    expect(result.conversationHistory).toEqual([]);
    expect(result.finished).toBe(false);
  });
});
