import { describe, expect, test } from 'vitest';
import { formatOutputStep } from '../../../src/steps/format-output-step';

describe('Format Output Step Unit Tests', () => {
  test('should handle direct ThinkAndPrepOutputSchema input', async () => {
    const thinkAndPrepOutput = {
      finished: true,
      outputMessages: [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ],
      conversationHistory: [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ],
      stepData: {
        stepType: 'think-and-prep',
        text: 'Test response',
        reasoning: 'Test reasoning',
        reasoningDetails: [],
        files: [],
        sources: [],
        toolCalls: [],
        toolResults: [],
        finishReason: 'completed',
        usage: {},
        warnings: [],
        logprobs: null,
        request: {},
        response: {
          id: 'test-id',
          timestamp: new Date(),
          modelId: 'claude-sonnet-4',
          headers: {},
          messages: [],
        },
        providerMetadata: {},
        experimental_providerMetadata: {},
        isContinued: false,
      },
      metadata: {
        toolsUsed: ['submitThoughts'],
        finalTool: 'submitThoughts' as const,
        text: 'Test response',
        reasoning: 'Test reasoning',
      },
    };

    const result = await formatOutputStep.execute({
      inputData: thinkAndPrepOutput,
      getInitData: async () => ({ prompt: 'test' }),
      runtimeContext: {} as any,
    });

    expect(result).toEqual({
      conversationHistory: thinkAndPrepOutput.conversationHistory,
      finished: thinkAndPrepOutput.finished,
      outputMessages: thinkAndPrepOutput.outputMessages,
      stepData: thinkAndPrepOutput.stepData,
      metadata: thinkAndPrepOutput.metadata,
      title: undefined,
      todos: undefined,
      values: undefined,
    });
  });

  test('should handle direct analyst step output', async () => {
    const analystOutput = {
      conversationHistory: [
        { role: 'user' as const, content: 'Analyze data' },
        { role: 'assistant' as const, content: 'Analysis complete' },
      ],
      finished: true,
      outputMessages: [
        { role: 'user' as const, content: 'Analyze data' },
        { role: 'assistant' as const, content: 'Analysis complete' },
      ],
      stepData: {
        stepType: 'analyst',
        text: 'Analysis response',
      },
      metadata: {
        toolsUsed: ['doneTool'],
      },
    };

    const result = await formatOutputStep.execute({
      inputData: analystOutput,
      getInitData: async () => ({ prompt: 'test' }),
      runtimeContext: {} as any,
    });

    expect(result).toEqual({
      conversationHistory: analystOutput.conversationHistory,
      finished: analystOutput.finished,
      outputMessages: analystOutput.outputMessages,
      stepData: analystOutput.stepData,
      metadata: analystOutput.metadata,
      title: undefined,
      todos: undefined,
      values: undefined,
    });
  });

  test('should handle nested workflow format with think-and-prep only', async () => {
    const nestedInput = {
      'think-and-prep': {
        finished: true,
        outputMessages: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' },
        ],
        conversationHistory: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' },
        ],
        stepData: { test: 'data' },
        metadata: { test: 'metadata' },
      },
    };

    const result = await formatOutputStep.execute({
      inputData: nestedInput,
      getInitData: async () => ({ prompt: 'test' }),
      runtimeContext: {} as any,
    });

    expect(result.conversationHistory).toEqual(nestedInput['think-and-prep'].conversationHistory);
    expect(result.finished).toBe(true);
  });

  test('should handle dynamic step data discovery', async () => {
    const dynamicInput = {
      'some-step-name': {
        conversationHistory: [{ role: 'user' as const, content: 'test' }],
        finished: false,
        outputMessages: [{ role: 'assistant' as const, content: 'response' }],
      },
    };

    const result = await formatOutputStep.execute({
      inputData: dynamicInput,
      getInitData: async () => ({ prompt: 'test' }),
      runtimeContext: {} as any,
    });

    expect(result.conversationHistory).toEqual(dynamicInput['some-step-name'].conversationHistory);
    expect(result.finished).toBe(false);
  });

  test('should throw error for truly unrecognized input format', async () => {
    const invalidInput = {
      someUnknownProperty: 'value',
      anotherProperty: { noStepData: true },
    };

    await expect(
      formatOutputStep.execute({
        inputData: invalidInput as any,
        getInitData: async () => ({ prompt: 'test' }),
        runtimeContext: {} as any,
      })
    ).rejects.toThrow('Unrecognized input format for format-output-step');
  });
});
