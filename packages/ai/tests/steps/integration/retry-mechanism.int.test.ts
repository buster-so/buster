import { setupTestEnvironment, withTestEnv } from '@buster/test-utils';
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { beforeAll, describe, expect, it } from 'vitest';
import { analystStep } from '../../../src/steps/analyst-step';
import { thinkAndPrepStep } from '../../../src/steps/think-and-prep-step';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

// Define types for the step outputs
interface ThinkAndPrepOutput {
  outputMessages: CoreMessage[];
  finished: boolean;
  conversationHistory: CoreMessage[];
  metadata?: {
    toolsUsed: string[];
    finalTool?: string;
  };
}

interface AnalystStepOutput {
  conversationHistory: CoreMessage[];
  finished: boolean;
  metadata?: {
    toolsUsed: string[];
    finalTool?: string;
  };
}

interface CreateTodosOutput {
  todos: string;
  reasoningHistory?: unknown[];
}

interface ExtractValuesSearchOutput {
  values: string[];
  searchResults: string;
  foundValues: Record<string, Record<string, string[]>>;
  searchPerformed: boolean;
}

interface GenerateChatTitleOutput {
  title: string;
}

interface ThinkAndPrepInputData {
  'create-todos': CreateTodosOutput;
  'extract-values-search': ExtractValuesSearchOutput;
  'generate-chat-title': GenerateChatTitleOutput;
  prompt: string;
  conversationHistory?: CoreMessage[];
}

interface AnalystInputData {
  finished: boolean;
  outputMessages: CoreMessage[];
  conversationHistory: CoreMessage[];
  metadata: {
    toolsUsed: string[];
    finalTool?: 'submitThoughts' | 'respondWithoutAnalysis' | undefined;
  };
}

describe('Retry Mechanism Integration Tests', () => {
  beforeAll(() => setupTestEnvironment());

  describe('ThinkAndPrep Step Retry', () => {
    it('should retry and heal on invalid tool call', async () => {
      await withTestEnv(async () => {
        const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
        runtimeContext.set('userId', 'test-user');
        runtimeContext.set('chatId', 'test-thread');

        // Create input data that simulates previous step outputs
        const inputData: ThinkAndPrepInputData = {
          'create-todos': {
            todos: '- Analyze the data\n  - User requested analysis',
          },
          'extract-values-search': {
            values: [],
            searchResults: '',
            foundValues: {},
            searchPerformed: false,
          },
          'generate-chat-title': {
            title: 'Test Analysis',
          },
          prompt: 'Test the retry mechanism by calling an invalid tool if possible',
          conversationHistory: [],
        };

        // This test will attempt to invoke a tool that might not exist or with invalid args
        // The retry mechanism should handle it gracefully
        const result = (await thinkAndPrepStep.execute({
          inputData,
          getInitData: async () => ({
            prompt: inputData.prompt,
            conversationHistory: inputData.conversationHistory || [],
          }),
          runtimeContext,
        })) as ThinkAndPrepOutput;

        // Verify the step completed successfully
        expect(result).toBeDefined();
        expect(result.outputMessages).toBeDefined();
        expect(Array.isArray(result.outputMessages)).toBe(true);

        // Check if any healing messages were injected (they would be tool result messages)
        const toolResultMessages = result.outputMessages.filter(
          (msg) =>
            msg.role === 'tool' || (msg.role === 'user' && msg.content === 'Please continue.')
        );

        // The presence of healing messages would indicate retry mechanism was triggered
        console.log('Tool result messages found:', toolResultMessages.length);
        console.log('Total messages:', result.outputMessages.length);
      }, 60000); // 60 second timeout for LLM calls
    });
  });

  describe('Analyst Step Retry', () => {
    it('should handle retry gracefully when given messages from think-and-prep', async () => {
      await withTestEnv(async () => {
        const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
        runtimeContext.set('userId', 'test-user');
        runtimeContext.set('chatId', 'test-thread');

        // Simulate output from think-and-prep step
        const mockMessages: CoreMessage[] = [
          { role: 'user', content: 'Analyze some data' },
          {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'I will analyze the data',
              },
              {
                type: 'tool-call',
                toolCallId: 'test-call-1',
                toolName: 'sequentialThinking',
                args: { thought: 'Starting analysis' },
              },
            ],
          },
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: 'test-call-1',
                toolName: 'sequentialThinking',
                result: { success: true },
              },
            ],
          },
        ];

        const inputData: AnalystInputData = {
          finished: false,
          outputMessages: mockMessages,
          conversationHistory: mockMessages,
          metadata: {
            toolsUsed: ['sequentialThinking'],
            finalTool: undefined,
          },
        };

        const result = (await analystStep.execute({
          inputData,
          getInitData: async () => ({
            prompt: 'Analyze some data',
            conversationHistory: [],
          }),
          runtimeContext,
        })) as AnalystStepOutput;

        // Verify the step completed
        expect(result).toBeDefined();
        expect(result.conversationHistory).toBeDefined();
        expect(Array.isArray(result.conversationHistory)).toBe(true);

        // The conversation history should include the original messages
        expect(result.conversationHistory.length).toBeGreaterThanOrEqual(mockMessages.length);
      }, 60000);
    });
  });

  describe('Conversation History Preservation', () => {
    it('should preserve conversation history through retries', async () => {
      await withTestEnv(async () => {
        const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
        runtimeContext.set('userId', 'test-user');
        runtimeContext.set('chatId', 'test-thread');

        const originalMessages: CoreMessage[] = [
          { role: 'user', content: 'Original question' },
          { role: 'assistant', content: 'Original response' },
        ];

        const inputData: ThinkAndPrepInputData = {
          'create-todos': {
            todos: '- Test retry with history\n  - Testing conversation preservation',
          },
          'extract-values-search': {
            values: [],
            searchResults: '',
            foundValues: {},
            searchPerformed: false,
          },
          'generate-chat-title': {
            title: 'Retry Test',
          },
          prompt: 'Follow up question',
          conversationHistory: originalMessages,
        };

        const result = (await thinkAndPrepStep.execute({
          inputData,
          getInitData: async () => ({
            prompt: inputData.prompt,
            conversationHistory: inputData.conversationHistory || [],
          }),
          runtimeContext,
        })) as ThinkAndPrepOutput;

        // Verify original messages are preserved
        expect(result.outputMessages).toBeDefined();

        // The conversation should start with the original messages
        const userMessages = result.outputMessages.filter((msg) => msg.role === 'user');
        const assistantMessages = result.outputMessages.filter((msg) => msg.role === 'assistant');

        expect(userMessages.length).toBeGreaterThan(0);
        expect(assistantMessages.length).toBeGreaterThan(0);

        // Check that we have a complete conversation flow
        expect(result.outputMessages.length).toBeGreaterThanOrEqual(originalMessages.length);
      }, 60000);
    });
  });
});
